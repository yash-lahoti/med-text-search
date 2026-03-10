'use client'

import { useAppState } from '@/lib/store'
import type { LeftTab, Subject } from '@/lib/types'
import TreeView from './TreeView'
import SearchView from './SearchView'
import TranscriptsPanel from './TranscriptsPanel'
import SettingsPanel from './SettingsPanel'
import PromptsPanel from './PromptsPanel'
import type { Settings, AIPrompt } from '@/lib/types'

interface Props {
  subjects: Subject[]
  onSelectSubject: (key: string) => void
  onSelectNode: (uid: string) => void
  onAddSubtopic: () => void
  onSearch: (q: string) => void
  onClearSearch: () => void
  searchLoading: boolean
  onSelectTx: (id: number) => void
  onNewTx: () => void
  onDaemonStart: () => void
  onDaemonStop: () => void
  onSaveSettings: (partial: Partial<Settings>) => void
  onSavePrompt: (payload: Partial<AIPrompt>) => void
  onDeletePrompt: (id: number) => void
}

export default function LeftPanel({
  subjects,
  onSelectSubject,
  onSelectNode,
  onAddSubtopic,
  onSearch,
  onClearSearch,
  searchLoading,
  onSelectTx,
  onNewTx,
  onDaemonStart,
  onDaemonStop,
  onSaveSettings,
  onSavePrompt,
  onDeletePrompt,
}: Props) {
  const { state } = useAppState()
  const tab = state.leftTab

  return (
    <aside
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: 'clamp(280px, 20vw, 360px)',
        background: 'var(--bg1)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Panel header */}
      <div className="px-4 pt-3.5 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-display text-[11px] font-bold tracking-[0.12em] text-[var(--dim)] uppercase">
          {tab === 'tree' ? 'Knowledge Tree'
            : tab === 'search' ? 'Semantic Search'
              : tab === 'transcripts' ? 'Transcripts'
                : tab === 'settings' ? 'Settings'
                  : 'Prompts'}
        </div>
      </div>

      {/* Subject tabs (tree only) */}
      {tab === 'tree' && (
        <div
          className="flex flex-wrap gap-1 px-3.5 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {subjects.map(s => (
            <button
              key={s.key}
              onClick={() => s.hasData && onSelectSubject(s.key)}
              className={[
                'px-2.5 py-1 font-mono text-[10px] cursor-pointer border rounded-full transition-all tracking-wider',
                !s.hasData ? 'opacity-30 cursor-not-allowed' : '',
                state.activeTreeSubj === s.key
                  ? 'text-[#080a0f] font-medium'
                  : 'text-[var(--dim)] border-[var(--border2)] hover:bg-[var(--bg2)] hover:text-[var(--text)]',
              ].join(' ')}
              style={
                state.activeTreeSubj === s.key
                  ? { backgroundColor: s.color ?? '#00d4b8', borderColor: s.color ?? '#00d4b8' }
                  : { background: 'transparent' }
              }
            >
              {s.short}
            </button>
          ))}
        </div>
      )}

      {/* Tree add btn */}
      {tab === 'tree' && (
        <div
          className="flex justify-end items-center px-3 py-1.5 gap-1.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={onAddSubtopic}
            disabled={!state.selectedUid}
            className="rounded-full border text-[var(--text-dim)] font-mono text-[9px] tracking-widest uppercase px-2.5 py-0.5 cursor-pointer disabled:opacity-35 disabled:cursor-default"
            style={{ borderColor: 'var(--border2)', background: 'transparent' }}
          >
            + ADD SUBTOPIC
          </button>
        </div>
      )}

      {/* Tree view */}
      {tab === 'tree' && (
        <TreeView onSelectNode={onSelectNode} onAddSubtopic={onAddSubtopic} />
      )}

      {/* Search view */}
      {tab === 'search' && (
        <SearchView
          onSearch={onSearch}
          onSelectNode={onSelectNode}
          onClear={onClearSearch}
          loading={searchLoading}
        />
      )}

      {/* Transcripts */}
      {tab === 'transcripts' && (
        <TranscriptsPanel
          onSelectTx={onSelectTx}
          onNewTx={onNewTx}
          onStart={onDaemonStart}
          onStop={onDaemonStop}
        />
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <SettingsPanel onSave={onSaveSettings} />
      )}

      {/* Prompts */}
      {tab === 'prompts' && (
        <PromptsPanel onSave={onSavePrompt} onDelete={onDeletePrompt} />
      )}
    </aside>
  )
}
