'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAppState } from '@/lib/store'
import type { LeftTab, Settings, AIPrompt } from '@/lib/types'
import * as api from '@/lib/api'

import Topbar from './Topbar'
import IconRail from './IconRail'
import LeftPanel from './LeftPanel'
import ReaderPanel from './ReaderPanel'
import SidePanel from './SidePanel'
import TranscriptViewer from './TranscriptViewer'
import Lightbox from './Lightbox'

// ── Toast badge ───────────────────────────────────────────────────────────────
function showToast(msg: string, duration = 2000) {
  const el = document.createElement('div')
  el.style.cssText = `position:fixed;bottom:20px;right:20px;background:var(--brand);color:#080a0f;padding:8px 16px;border-radius:4px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;z-index:9999;`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), duration)
}

export default function MedApp() {
  const { state, dispatch } = useAppState()
  const imageUploadRef = useRef<HTMLInputElement>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [txCurrentText, setTxCurrentText] = useState('')
  const prevDaemonStatus = useRef('idle')
  const txImageCacheRef = useRef<Record<number, string>>({})
  const [txImageItems, setTxImageItems] = useState<{ id: number; mime_type: string; filename?: string; data_b64?: string }[]>([])

  // ── Boot ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    pollReady()
    loadSubjects()
    loadTranscripts()
    loadPrompts()
    loadSettings()
    const daemonInterval = setInterval(pollDaemon, 1200)
    return () => clearInterval(daemonInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── AI run event ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { promptId } = e.detail
      handleAIRun(promptId)
    }
    window.addEventListener('ai-run-request' as any, handler)
    return () => window.removeEventListener('ai-run-request' as any, handler)
  }, [state.selectedTxId])

  // ── Alt+R shortcut ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'r') { e.preventDefault(); daemonToggle() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.daemonStatus.status])

  // ── Paste images ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!state.selectedTxId) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { uploadTxImage(file); e.preventDefault() }
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [state.selectedTxId])

  // ── Subjects / subjects fallback ─────────────────────────────────────────────
  async function loadSubjects() {
    // Attempt to fetch subjects from the server (they'd be embedded via template in the original)
    try {
      const r = await fetch('/api/subjects')
      if (r.ok) {
        const subjects = await r.json()
        dispatch({ type: 'SET_SUBJECTS', subjects })
        const first = subjects.find((s: any) => s.hasData)
        if (first) loadTreeSubject(first.key)
      }
    } catch {}
  }

  // ── Poll ready ───────────────────────────────────────────────────────────────
  async function pollReady() {
    while (true) {
      try {
        const d = await api.fetchReady()
        if (d.ready) {
          dispatch({ type: 'SET_GRAPH_READY', ready: true })
          return
        }
      } catch {}
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // ── Tree ─────────────────────────────────────────────────────────────────────
  async function loadTreeSubject(key: string) {
    if (state.activeTreeSubj === key && state.treeData) return
    dispatch({ type: 'SET_ACTIVE_TREE_SUBJ', key })
    try {
      const data = await api.fetchTree(key)
      dispatch({ type: 'SET_TREE_DATA', data })
    } catch (e) {
      console.error('Failed to load tree', e)
    }
  }

  // ── Node selection ───────────────────────────────────────────────────────────
  const selectNode = useCallback(async (uid: string) => {
    dispatch({ type: 'SET_SELECTED_UID', uid })

    let fullNode = state.nodeCache[uid]
    if (!fullNode) {
      try {
        fullNode = await api.fetchNode(uid)
        dispatch({ type: 'SET_NODE_CACHE', uid, node: fullNode })
      } catch (e) {
        console.error('Failed to fetch node', e)
        return
      }
    }

    dispatch({ type: 'SET_ACTIVE_NODE', node: fullNode })
    dispatch({ type: 'SET_ACTIVE_NODE_TEXT', text: fullNode.text ?? '' })

    // Load graph vis
    try {
      const graphData = await api.fetchGraph(uid)
      dispatch({ type: 'SET_GRAPH_DATA', data: graphData })
    } catch {}

    // Link node to active transcript
    if (state.selectedTxId) {
      dispatch({ type: 'SET_TX_NODE_UID', uid })
      try {
        await api.patchTranscript(state.selectedTxId, { node_uid: uid })
        await loadTranscripts()
      } catch {}
    }
  }, [state.nodeCache, state.selectedTxId, dispatch])

  // ── Search ───────────────────────────────────────────────────────────────────
  async function handleSearch(query: string) {
    setSearchLoading(true)
    try {
      const bundle = await api.runSearch(query)
      dispatch({ type: 'SET_GRAPH_BUNDLE', bundle })
      if (bundle.nodes?.length > 0) selectNode(bundle.nodes[0].uid)
    } catch (e) {
      console.error('Search failed', e)
    } finally {
      setSearchLoading(false)
    }
  }

  function handleClearSearch() {
    dispatch({ type: 'SET_GRAPH_BUNDLE', bundle: null })
  }

  // ── Add subtopic ──────────────────────────────────────────────────────────────
  async function handleAddSubtopic() {
    if (!state.selectedUid || !state.activeTreeSubj) return
    const title = prompt('New subtopic title:')
    if (!title) return
    const body = prompt('Optional notes for this subtopic (markdown):') ?? ''
    try {
      const node = await api.createUserNode({
        parent_uid: state.selectedUid,
        subject: state.activeTreeSubj,
        title,
        text: body,
      })
      await loadTreeSubject(state.activeTreeSubj)
      selectNode(node.uid)
    } catch (e: any) {
      alert('Error creating node: ' + e.message)
    }
  }

  // ── Save user node ─────────────────────────────────────────────────────────
  async function handleSaveUserNode(uid: string, text: string) {
    try {
      const node = await api.patchUserNode(uid, text)
      dispatch({ type: 'SET_NODE_CACHE', uid, node })
    } catch (e: any) {
      alert('Error saving node: ' + e.message)
    }
  }

  // ── PDF Zoom ──────────────────────────────────────────────────────────────────
  function handleZoom(delta: number) {
    const next = delta === 0 ? 100 : Math.max(50, Math.min(250, state.currentPdfZoom + delta))
    dispatch({ type: 'SET_PDF_ZOOM', zoom: next })
  }

  // ── Copy node text ────────────────────────────────────────────────────────────
  function handleCopyText() {
    const text = state.activeNodeRawText
    if (!text) return
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast('COPIED!'))
    } else {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'
      document.body.appendChild(ta); ta.focus(); ta.select()
      try { document.execCommand('copy'); showToast('COPIED!') } catch {}
      document.body.removeChild(ta)
    }
  }

  // ── Daemon ────────────────────────────────────────────────────────────────────
  async function pollDaemon() {
    try {
      const d = await api.fetchDaemonStatus()
      dispatch({ type: 'SET_DAEMON_STATUS', status: d })
      if (prevDaemonStatus.current !== 'idle' && d.status === 'idle') {
        loadTranscripts()
      }
      prevDaemonStatus.current = d.status
    } catch {}
  }

  function daemonToggle() {
    if (state.daemonStatus.status === 'recording') {
      api.daemonStop().then(() => setTimeout(loadTranscripts, 4000))
    } else {
      api.daemonStart()
    }
  }

  // ── Transcripts ───────────────────────────────────────────────────────────────
  async function loadTranscripts() {
    try {
      const list = await api.fetchTranscripts()
      dispatch({ type: 'SET_TX_LIST', list })
    } catch {}
  }

  async function handleSelectTx(id: number) {
    dispatch({ type: 'SET_SELECTED_TX', id })
    dispatch({ type: 'SET_TX_NODE_UID', uid: null })
    dispatch({ type: 'SET_SEMANTIC_NODES', nodes: [] })
    await api.setActiveTranscript(id)
    try {
      const data = await api.fetchTranscript(id)
      dispatch({ type: 'SET_TX_TEXT', text: data.content ?? '' })
      dispatch({ type: 'SET_TX_DIRTY', dirty: false })
      dispatch({ type: 'SET_TX_NODE_UID', uid: data.node_uid ?? null })
      dispatch({ type: 'SET_AI_OUTPUTS', outputs: data.outputs ?? [] })
    } catch {}
    // load images
    loadTxImages(id)
  }

  function handleNewTx() {
    dispatch({ type: 'SET_SELECTED_TX', id: null })
    dispatch({ type: 'SET_TX_NODE_UID', uid: null })
    dispatch({ type: 'SET_TX_TEXT', text: '' })
    dispatch({ type: 'SET_TX_DIRTY', dirty: false })
    dispatch({ type: 'SET_AI_OUTPUTS', outputs: [] })
    dispatch({ type: 'SET_SEMANTIC_NODES', nodes: [] })
    setTxImageItems([])
    api.setActiveTranscript(null)
  }

  async function handleSaveTx() {
    const content = txCurrentText.trim()
    if (!content) return alert('Cannot save an empty transcript.')
    try {
      if (state.selectedTxId) {
        await api.patchTranscript(state.selectedTxId, { content, node_uid: state.selectedTxNodeUid })
      } else {
        const d = await api.createTranscript(content)
        if (d.ok) {
          dispatch({ type: 'SET_SELECTED_TX', id: d.id })
          await api.setActiveTranscript(d.id)
        }
      }
      dispatch({ type: 'SET_TX_DIRTY', dirty: false })
      showToast('SAVED ✓')
      loadTranscripts()
    } catch (e: any) {
      alert('Save failed: ' + e.message)
    }
  }

  async function handleDeleteTx() {
    if (!state.selectedTxId) return
    await api.deleteTranscript(state.selectedTxId)
    await api.setActiveTranscript(null)
    dispatch({ type: 'SET_SELECTED_TX', id: null })
    dispatch({ type: 'SET_TX_TEXT', text: '' })
    dispatch({ type: 'SET_AI_OUTPUTS', outputs: [] })
    setTxImageItems([])
    loadTranscripts()
  }

  async function handleAppendText(text: string) {
    if (!state.selectedTxId || !text.trim()) return
    try {
      const d = await api.appendTranscript(state.selectedTxId, text)
      if (d.ok && d.content) {
        dispatch({ type: 'SET_TX_TEXT', text: d.content })
        dispatch({ type: 'SET_TX_DIRTY', dirty: false })
      }
      loadTranscripts()
    } catch (e: any) {
      alert('Append failed: ' + e.message)
    }
  }

  async function handleSearchFromTranscript() {
    if (!txCurrentText.trim()) return alert('Open a transcript first.')
    dispatch({ type: 'SET_LEFT_TAB', tab: 'search' })
    setSearchLoading(true)
    try {
      const bundle = await api.runSearch(txCurrentText, 12)
      dispatch({ type: 'SET_GRAPH_BUNDLE', bundle })
      if (bundle.nodes?.length > 0) selectNode(bundle.nodes[0].uid)
    } catch {}
    setSearchLoading(false)
  }

  // ── Tx images ─────────────────────────────────────────────────────────────────
  async function loadTxImages(tid: number) {
    try {
      const imgs = await api.fetchTxImages(tid)
      const items = imgs.map(img => ({
        id: img.id,
        mime_type: img.mime_type,
        filename: img.filename,
        data_b64: txImageCacheRef.current[img.id],
      }))
      setTxImageItems(items)
      // Lazy-load missing data
      for (const img of imgs) {
        if (!txImageCacheRef.current[img.id]) {
          api.fetchTxImageData(tid, img.id).then(d => {
            if (d.data_b64) {
              txImageCacheRef.current[img.id] = d.data_b64
              setTxImageItems(prev => prev.map(i => i.id === img.id ? { ...i, data_b64: d.data_b64 } : i))
            }
          })
        }
      }
    } catch {}
  }

  async function uploadTxImage(file: File) {
    if (!state.selectedTxId) return
    const d = await api.uploadTxImage(state.selectedTxId, file)
    if (d.ok && d.id && d.data_b64) txImageCacheRef.current[d.id] = d.data_b64
    loadTxImages(state.selectedTxId)
  }

  async function deleteTxImage(iid: number) {
    if (!state.selectedTxId) return
    delete txImageCacheRef.current[iid]
    await api.deleteTxImage(state.selectedTxId, iid)
    loadTxImages(state.selectedTxId)
  }

  // ── AI ────────────────────────────────────────────────────────────────────────
  async function handleAIRun(promptId: number) {
    if (!state.selectedTxId) return
    setAiRunning(true)
    dispatch({ type: 'SET_AI_OUTPUTS', outputs: [] })
    let streamingText = ''
    const outputs: import('@/lib/types').AIOutput[] = []

    try {
      for await (const d of api.runAI(state.selectedTxId, promptId)) {
        if (d.event === 'delta') {
          streamingText += d.text ?? ''
          dispatch({
            type: 'SET_AI_OUTPUTS', outputs: [{
              output_text: streamingText,
              prompt_name: '✦ GENERATING…',
              created_at: '',
            }]
          })
        } else if (d.event === 'result') {
          streamingText = ''
          const promptName = state.aiPrompts.find(p => p.id === promptId)?.name ?? 'AI RESPONSE'
          const newOutput: import('@/lib/types').AIOutput = {
            output_text: d.text ?? '',
            prompt_name: promptName,
            created_at: new Date().toLocaleTimeString(),
          }
          outputs.unshift(newOutput)
          dispatch({ type: 'SET_AI_OUTPUTS', outputs })
          if (Array.isArray(d.semantic_nodes)) {
            dispatch({ type: 'SET_SEMANTIC_NODES', nodes: d.semantic_nodes })
          }
        }
      }
    } catch (e) {
      console.error('AI run error', e)
    }
    setAiRunning(false)
  }

  function handleCopyToTranscript(text: string) {
    const current = txCurrentText.trim()
    const separator = current ? '\n\n---\n**AI INSIGHTS**\n' : '**AI INSIGHTS**\n'
    const next = current + separator + text
    dispatch({ type: 'SET_TX_TEXT', text: next })
    dispatch({ type: 'SET_TX_DIRTY', dirty: true })
    showToast('COPIED TO TRANSCRIPT')
  }

  async function handleOpenSemanticNode(uid: string) {
    dispatch({ type: 'SET_LEFT_TAB', tab: 'tree' })
    selectNode(uid)
  }

  // ── Prompts ───────────────────────────────────────────────────────────────────
  async function loadPrompts() {
    try {
      const prompts = await api.fetchPrompts()
      dispatch({ type: 'SET_AI_PROMPTS', prompts })
    } catch {}
  }

  async function handleSavePrompt(payload: Partial<AIPrompt>) {
    await api.savePrompt(payload)
    loadPrompts()
  }

  async function handleDeletePrompt(id: number) {
    await api.deletePrompt(id)
    loadPrompts()
  }

  // ── Settings ──────────────────────────────────────────────────────────────────
  async function loadSettings() {
    try {
      const s = await api.fetchSettings()
      dispatch({ type: 'SET_SETTINGS', settings: s })
    } catch {}
  }

  async function handleSaveSettings(partial: Partial<Settings>) {
    try {
      await api.patchSettings(partial)
      showToast('Saved ✓', 1500)
    } catch {}
  }

  // ── User node image ───────────────────────────────────────────────────────────
  async function handleUserNodeImageSelected(file: File) {
    const n = state.activeNode
    if (!n?.is_user) return
    try {
      const d = await api.uploadUserNodeImage(n.uid, file)
      if (!d.ok) return alert(d.error ?? 'Upload failed')
      const updated = await api.fetchUserNode(n.uid)
      dispatch({ type: 'SET_NODE_CACHE', uid: n.uid, node: updated })
      dispatch({ type: 'SET_ACTIVE_NODE', node: updated })
    } catch (e: any) {
      alert('Error uploading image: ' + e.message)
    }
  }

  // ── Determine what center/layout shows ────────────────────────────────────────
  const isReaderMode = state.leftTab === 'tree' || state.leftTab === 'search'
  const isTxMode = state.leftTab === 'transcripts'

  return (
    <>
      {/* D3 script */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js" async />
      {/* marked.js */}
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" async />

      <div className="h-screen flex flex-col overflow-hidden">
        <Topbar onToggleRecording={daemonToggle} />

        <div className="flex flex-1 overflow-hidden">
          <IconRail onTabChange={() => {}} />

          <LeftPanel
            subjects={state.subjects}
            onSelectSubject={loadTreeSubject}
            onSelectNode={selectNode}
            onAddSubtopic={handleAddSubtopic}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            searchLoading={searchLoading}
            onSelectTx={handleSelectTx}
            onNewTx={handleNewTx}
            onDaemonStart={api.daemonStart}
            onDaemonStop={() => api.daemonStop().then(() => setTimeout(loadTranscripts, 4000))}
            onSaveSettings={handleSaveSettings}
            onSavePrompt={handleSavePrompt}
            onDeletePrompt={handleDeletePrompt}
          />

          {/* Center panel */}
          <main className="flex-1 flex overflow-hidden" style={{ background: 'var(--bg)' }}>
            {isReaderMode && (
              <>
                <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--border)' }}>
                  <ReaderPanel
                    onSaveUserNode={handleSaveUserNode}
                    onZoom={handleZoom}
                    onCopyText={handleCopyText}
                    onTriggerImageUpload={() => imageUploadRef.current?.click()}
                    imageUploadRef={imageUploadRef}
                    onImageFileSelected={handleUserNodeImageSelected}
                  />
                </div>
                <SidePanel
                  onSelectNode={selectNode}
                  onSaveUserNode={handleSaveUserNode}
                  onZoom={handleZoom}
                  onCopyText={handleCopyText}
                  onTriggerImageUpload={() => imageUploadRef.current?.click()}
                  imageUploadRef={imageUploadRef}
                  onImageFileSelected={handleUserNodeImageSelected}
                  onOpenLightbox={src => dispatch({ type: 'SET_LIGHTBOX', src })}
                />
              </>
            )}

            {isTxMode && (
              <TranscriptViewer
                onSave={handleSaveTx}
                onDelete={handleDeleteTx}
                onSearchFromTranscript={handleSearchFromTranscript}
                onRunAI={handleAIRun.bind(null, 0)}
                onAppendText={handleAppendText}
                onCopyToTranscript={handleCopyToTranscript}
                onOpenSemanticNode={handleOpenSemanticNode}
                onUploadTxImage={uploadTxImage}
                onDeleteTxImage={deleteTxImage}
                txImageItems={txImageItems}
                aiRunning={aiRunning}
                onTextChange={setTxCurrentText}
              />
            )}

            {/* Fallback for settings/prompts (no center view) */}
            {!isReaderMode && !isTxMode && (
              <div className="flex-1 flex items-center justify-center">
                <div className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">
                  Configure your settings<br />or manage prompts in the left panel
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Lightbox />
    </>
  )
}
