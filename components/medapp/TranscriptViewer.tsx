'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useAppState } from '@/lib/store'
import type { AIOutput } from '@/lib/types'

declare const marked: { parse: (s: string) => string }

interface Props {
  onSave: () => void
  onDelete: () => void
  onSearchFromTranscript: () => void
  onRunAI: () => void
  onAppendText: (text: string) => void
  onCopyToTranscript: (text: string) => void
  onOpenSemanticNode: (uid: string) => void
  onUploadTxImage: (file: File) => void
  onDeleteTxImage: (iid: number) => void
  txImageItems: { id: number; mime_type: string; filename?: string; data_b64?: string }[]
  aiRunning: boolean
  onTextChange: (text: string) => void
}

export default function TranscriptViewer({
  onSave, onDelete, onSearchFromTranscript, onRunAI, onAppendText,
  onCopyToTranscript, onOpenSemanticNode, onUploadTxImage, onDeleteTxImage,
  txImageItems, aiRunning, onTextChange,
}: Props) {
  const { state, dispatch } = useAppState()
  const panelRef = useRef<HTMLDivElement>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [rawText, setRawText] = useState('')
  const [appendOpen, setAppendOpen] = useState(false)
  const [appendText, setAppendText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaZoneRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  // Sync text from store when transcript changes
  useEffect(() => {
    if (!previewMode) {
      setRawText(state.txText)
      if (panelRef.current) {
        panelRef.current.textContent = state.txText
        panelRef.current.classList.remove('dirty')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedTxId])

  function handleInput() {
    const text = panelRef.current?.innerText ?? ''
    setRawText(text)
    onTextChange(text)
    dispatch({ type: 'SET_TX_DIRTY', dirty: true })
  }

  // ── Markdown formatting helpers ───────────────────────────────────────────
  function wrapSelection(prefix: string, suffix: string) {
    if (previewMode || !panelRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (!panelRef.current.contains(range.commonAncestorContainer)) return
    const selected = sel.toString()
    const replacement = selected ? prefix + selected + suffix : prefix + suffix
    range.deleteContents()
    range.insertNode(document.createTextNode(replacement))
    sel.removeAllRanges()
    dispatch({ type: 'SET_TX_DIRTY', dirty: true })
  }

  function togglePreview() {
    if (!previewMode) {
      const text = panelRef.current?.innerText ?? rawText
      setRawText(text)
      if (panelRef.current && typeof marked !== 'undefined') {
        panelRef.current.innerHTML = `<div class="content-markdown">${marked.parse(text)}</div>`
        panelRef.current.contentEditable = 'false'
      }
      setPreviewMode(true)
    } else {
      if (panelRef.current) {
        panelRef.current.textContent = rawText
        panelRef.current.contentEditable = 'true'
      }
      setPreviewMode(false)
    }
  }

  // ── Drag and drop for images ──────────────────────────────────────────────
  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setDragOver(true) }
  const onDragLeave = () => { dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragOver(false) } }
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setDragOver(false)
    if (!state.selectedTxId) return
    Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).forEach(f => onUploadTxImage(f))
  }

  const txNodeUid = state.selectedTxNodeUid

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg1)' }}
      >
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-[13px] font-semibold text-[var(--text)]">
            {state.selectedTxId ? (state.txList.find(t => t.id === state.selectedTxId)?.created_at ?? 'Transcript') : 'New Transcript'}
          </div>
          {txNodeUid && (
            <button
              onClick={() => onOpenSemanticNode(txNodeUid)}
              className="self-start px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wider uppercase text-[var(--sem-color)] cursor-pointer border transition-colors hover:bg-[rgba(168,85,247,0.2)] hover:border-[var(--sem-color)]"
              style={{ border: '1px solid var(--border2)', background: 'rgba(168,85,247,0.12)' }}
            >
              {txNodeUid}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSearchFromTranscript}
            className="py-1.5 px-3.5 font-mono text-[11px] font-semibold cursor-pointer border text-[var(--text-dim)] border-[var(--border2)] bg-transparent rounded-sm hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            FIND IN GRAPH →
          </button>
          {state.selectedTxId && (
            <button
              onClick={onSave}
              className={[
                'py-1.5 px-3.5 font-mono text-[11px] font-semibold cursor-pointer border rounded-sm',
                state.txDirty
                  ? 'bg-[rgba(245,166,35,0.18)] border-[#f5a623] text-[#f5a623]'
                  : 'text-[var(--text-dim)] border-[var(--border2)] bg-transparent hover:border-[var(--brand)] hover:text-[var(--brand)]',
              ].join(' ')}
            >
              SAVE
            </button>
          )}
          <button
            onClick={() => { if (confirm('Delete this transcript?')) onDelete() }}
            className="py-1.5 px-3.5 font-mono text-[11px] font-semibold cursor-pointer border text-[var(--seed-color)] border-[rgba(255,78,106,0.5)] bg-transparent rounded-sm hover:bg-[rgba(255,78,106,0.1)]"
          >
            DELETE
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ borderRight: '1px solid var(--border)' }}>
          {/* Toolbar */}
          <div
            className="flex gap-1.5 px-3 pt-2 pb-1.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'radial-gradient(circle at top left, rgba(0,212,184,0.18), transparent 55%), rgba(8,11,18,0.95)' }}
          >
            {[
              { label: 'B', action: () => wrapSelection('**', '**'), title: 'Bold' },
              { label: 'I', action: () => wrapSelection('*', '*'), title: 'Italic', italic: true },
              { label: 'H2', action: () => { /* heading insert */ }, title: 'Heading' },
              { label: '• List', action: () => { /* bullet */ }, title: 'Bullet list' },
              { label: '1. List', action: () => { /* numbered */ }, title: 'Numbered list' },
            ].map(b => (
              <button
                key={b.label}
                onClick={b.action}
                title={b.title}
                className="bg-transparent border border-[rgba(148,163,184,0.4)] rounded-md text-[var(--text-dim)] font-mono text-[10px] px-2 py-1 cursor-pointer uppercase tracking-wider transition-all hover:bg-[rgba(15,23,42,0.9)] hover:text-[var(--brand)] hover:border-[var(--brand)] active:translate-y-px"
              >
                {b.italic ? <span className="italic">{b.label}</span> : b.label}
              </button>
            ))}
            <button
              onClick={togglePreview}
              className="bg-transparent border border-[rgba(148,163,184,0.4)] rounded-md text-[var(--text-dim)] font-mono text-[10px] px-2 py-1 cursor-pointer uppercase tracking-wider transition-all hover:bg-[rgba(15,23,42,0.9)] hover:text-[var(--brand)] hover:border-[var(--brand)]"
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>

          {/* Editable text */}
          <div
            ref={panelRef}
            contentEditable={!previewMode}
            suppressContentEditableWarning
            onInput={handleInput}
            data-placeholder="Select a transcript to view and edit its text…"
            className={[
              'flex-1 p-3.5 overflow-y-auto text-[13px] leading-[1.8] text-[var(--text-dim)] outline-none break-words font-mono',
              state.txDirty ? 'shadow-[inset_0_0_0_1px_rgba(245,166,35,0.35)]' : '',
              previewMode ? 'font-sans text-[var(--text)] bg-[var(--bg1)] shadow-[0_0_0_1px_var(--border)] rounded-lg' : 'bg-[var(--bg)]',
            ].join(' ')}
            style={{ whiteSpace: 'pre-wrap', minHeight: 80 }}
          />

          {/* Semantic chips */}
          {state.lastSemanticNodes.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-4 py-2 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--bg1)' }}
            >
              <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--dim)] flex-shrink-0">GRAPH CONTEXT</span>
              <div className="flex flex-wrap gap-1.5">
                {state.lastSemanticNodes.map(n => (
                  <button
                    key={n.uid}
                    onClick={() => onOpenSemanticNode(n.uid)}
                    title={n.path ?? n.uid}
                    className="rounded-full border font-mono text-[10px] px-2.5 py-1 cursor-pointer max-w-[220px] truncate text-[var(--text)] bg-[rgba(0,212,184,0.06)] transition-all hover:bg-[rgba(0,212,184,0.16)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    style={{ borderColor: 'var(--border2)' }}
                  >
                    {n.title || n.uid}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Append section */}
          <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              onClick={() => setAppendOpen(o => !o)}
              className="flex items-center justify-between px-3.5 py-1.5 cursor-pointer select-none font-mono text-[9px] tracking-widest text-[var(--dim)] hover:text-[var(--brand)] transition-colors"
              style={{ background: 'var(--bg2)' }}
            >
              <span>APPEND TEXT</span>
              <span className={`text-[8px] transition-transform ${appendOpen ? 'rotate-90' : ''}`}>▶</span>
            </div>
            {appendOpen && (
              <div className="px-3.5 py-2.5" style={{ background: 'var(--bg1)' }}>
                <textarea
                  className="w-full min-h-[90px] bg-[var(--bg)] border border-[var(--border2)] rounded text-[var(--text)] text-[12px] font-sans leading-[1.7] px-2.5 py-2 resize-y outline-none focus:border-[var(--brand)]"
                  placeholder="Append text to this transcript…"
                  value={appendText}
                  onChange={e => setAppendText(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { onAppendText(appendText); setAppendText(''); setAppendOpen(false) }}
                    className="flex-1 py-1.5 font-mono text-[10px] tracking-wider rounded-sm cursor-pointer border bg-[var(--brand)] text-[#080a0f] border-[var(--brand)] hover:brightness-110"
                  >
                    APPEND
                  </button>
                  <button
                    onClick={() => setAppendOpen(false)}
                    className="flex-1 py-1.5 font-mono text-[10px] tracking-wider rounded-sm cursor-pointer border text-[var(--text-dim)] border-[var(--border2)] bg-transparent hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Media zone */}
          <div
            ref={mediaZoneRef}
            className="flex-shrink-0 relative"
            style={{ borderTop: '1px solid var(--border)' }}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div
              className="flex items-center justify-between px-3.5 py-1.5"
              style={{ background: 'var(--bg2)' }}
            >
              <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--dim)]">MEDIA</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[9px] tracking-wider text-[var(--brand)] cursor-pointer border rounded-sm px-2 py-0.5 transition-colors hover:bg-[var(--brand-dim)]"
                style={{ border: '1px solid rgba(0,212,184,0.35)' }}
              >
                ADD IMAGE
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUploadTxImage(f); e.target.value = '' }}
              />
            </div>
            <div className="p-2.5 min-h-[90px] flex items-start gap-2 flex-wrap">
              {txImageItems.map(img => (
                <div
                  key={img.id}
                  className="relative w-[72px] h-[72px] rounded overflow-hidden flex-shrink-0 cursor-pointer transition-all hover:border-[var(--brand)]"
                  style={{ border: '1px solid var(--border2)' }}
                >
                  {img.data_b64 ? (
                    <img
                      src={`data:${img.mime_type};base64,${img.data_b64}`}
                      className="w-full h-full object-cover"
                      alt={img.filename ?? ''}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="spinner" style={{ margin: 0, width: 14, height: 14 }} />
                    </div>
                  )}
                  <button
                    onClick={() => onDeleteTxImage(img.id)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[var(--seed-color)] text-[10px] border-none cursor-pointer"
                    style={{ background: 'rgba(13,16,23,0.85)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {txImageItems.length === 0 && (
                <div
                  className={`flex items-center justify-center flex-1 min-h-[60px] font-mono text-[11px] rounded transition-colors ${dragOver ? 'border-[var(--brand)] text-[var(--brand)]' : 'text-[var(--dim)]'}`}
                  style={{ border: `1px dashed ${dragOver ? 'var(--brand)' : 'var(--border2)'}` }}
                >
                  drop images or paste
                </div>
              )}
            </div>
            {dragOver && (
              <div
                className="absolute inset-0 flex items-center justify-center z-20 rounded"
                style={{ background: 'rgba(0,212,184,0.08)', border: '2px dashed var(--brand)' }}
              >
                <span className="font-display text-[18px] font-bold tracking-wider text-[var(--brand)]" style={{ textShadow: 'var(--brand-glow)' }}>
                  DROP TO ATTACH
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Panel */}
        <AIPanel
          onRunAI={onRunAI}
          onCopyToTranscript={onCopyToTranscript}
          aiRunning={aiRunning}
        />
      </div>
    </div>
  )
}

function AIPanel({ onRunAI, onCopyToTranscript, aiRunning }: {
  onRunAI: () => void
  onCopyToTranscript: (text: string) => void
  aiRunning: boolean
}) {
  const { state } = useAppState()
  const [selectedPromptId, setSelectedPromptId] = useState('')

  // Expose selected prompt to parent via custom event
  useEffect(() => {
    const h = (e: CustomEvent) => setSelectedPromptId(String(e.detail))
    window.addEventListener('set-prompt-id' as any, h)
    return () => window.removeEventListener('set-prompt-id' as any, h)
  }, [])

  function handleRun() {
    if (selectedPromptId) {
      window.dispatchEvent(new CustomEvent('ai-run-request', { detail: { promptId: parseInt(selectedPromptId) } }))
    }
  }

  return (
    <div
      className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--bg1)' }}
    >
      <div
        className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between font-display text-[11px] font-extrabold text-[var(--brand)] tracking-[0.18em] uppercase"
        style={{ borderBottom: '1px solid var(--border)', background: 'radial-gradient(circle at top left, rgba(0,212,184,0.24), transparent 55%), var(--bg2)' }}
      >
        <span>AI PROCESSOR</span>
        <span
          className="font-mono text-[9px] px-2 py-0.5 rounded-full text-[var(--dim)]"
          style={{ border: '1px solid rgba(148,163,184,0.6)', background: 'rgba(15,23,42,0.3)' }}
        >
          semantic + structured
        </span>
      </div>

      <div
        className="px-3.5 py-3 flex-shrink-0 flex flex-col gap-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(to bottom, rgba(15,23,42,0.85), rgba(15,23,42,0.95))' }}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--dim)]">Prompt</span>
        <select
          value={selectedPromptId}
          onChange={e => setSelectedPromptId(e.target.value)}
          className="w-full rounded-full border text-[#e5e7eb] py-1.5 px-3 text-[11px] font-mono outline-none appearance-none cursor-pointer"
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(148,163,184,0.7)',
            backgroundImage: 'linear-gradient(45deg, transparent 50%, #9ca3af 50%), linear-gradient(135deg, #9ca3af 50%, transparent 50%)',
            backgroundPosition: 'calc(100% - 14px) 11px, calc(100% - 9px) 11px',
            backgroundSize: '5px 5px, 5px 5px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <option value="">— select prompt —</option>
          {state.aiPrompts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (!selectedPromptId) return alert('Select a prompt first.')
              if (!state.selectedTxId) return alert('Select a transcript first.')
              window.dispatchEvent(new CustomEvent('ai-run-request', { detail: { promptId: parseInt(selectedPromptId) } }))
            }}
            disabled={aiRunning}
            className="py-2 px-4 font-mono text-[11px] tracking-wider cursor-pointer border rounded-sm bg-[var(--brand)] text-[#080a0f] border-[var(--brand)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiRunning ? 'RUNNING…' : 'RUN AI'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ background: 'var(--bg)' }}>
        {state.aiOutputs.length === 0 && !aiRunning ? (
          <div className="flex flex-col items-center justify-center gap-2.5 p-5">
            <span className="text-2xl opacity-25">✦</span>
            <p className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">Pick a prompt and click Run AI</p>
          </div>
        ) : (
          state.aiOutputs.map((o, idx) => (
            <OutputBlock key={idx} output={o} defaultOpen={idx === 0} onCopy={() => onCopyToTranscript(o.output_text)} />
          ))
        )}
      </div>
    </div>
  )
}

function OutputBlock({ output, defaultOpen, onCopy }: { output: AIOutput; defaultOpen: boolean; onCopy: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  const html = typeof marked !== 'undefined' ? marked.parse(output.output_text ?? '') : output.output_text

  return (
    <div
      className={`rounded-lg overflow-hidden flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.2)] mb-2.5`}
      style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        className="px-3.5 py-2.5 flex justify-between items-center cursor-pointer select-none"
        style={{ background: 'var(--bg2)', borderBottom: open ? '1px solid var(--border)' : 'none' }}
      >
        <span className="font-display font-extrabold text-[10px] tracking-widest text-[var(--brand)] uppercase">
          {output.prompt_name ?? 'AI RESPONSE'}
        </span>
        <span className="font-mono text-[9px] text-[var(--dim)] flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onCopy() }}
            className="px-3 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-[var(--brand)] hover:text-[#080a0f]"
            style={{ background: 'rgba(0,212,184,0.1)', border: '1px solid var(--brand-dim)', color: 'var(--brand)' }}
          >
            Copy
          </button>
          <span>{output.created_at ?? ''}</span>
          <span
            className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px]"
            style={{ border: '1px solid var(--border2)', background: 'rgba(15,23,42,0.9)', color: 'var(--dim)' }}
          >
            {open ? '−' : '+'}
          </span>
        </span>
      </div>
      {open && (
        <div
          className="px-5 py-4 text-[13px] leading-[1.7] text-[var(--text)] content-markdown overflow-y-auto"
          style={{ maxHeight: 320 }}
          dangerouslySetInnerHTML={{ __html: html ?? '' }}
        />
      )}
    </div>
  )
}
