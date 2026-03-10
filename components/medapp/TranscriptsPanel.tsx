'use client'

import { useAppState } from '@/lib/store'
import type { Transcript } from '@/lib/types'

interface Props {
  onSelectTx: (id: number) => void
  onNewTx: () => void
  onStart: () => void
  onStop: () => void
}

export default function TranscriptsPanel({ onSelectTx, onNewTx, onStart, onStop }: Props) {
  const { state } = useAppState()
  const { daemonStatus, txList, selectedTxId } = state

  const recDotCls =
    daemonStatus.status === 'recording'
      ? 'w-2 h-2 rounded-full bg-[var(--seed-color)] animate-[blink_1s_step-start_infinite]'
      : daemonStatus.status === 'transcribing'
        ? 'w-2 h-2 rounded-full bg-[var(--sibling-color)]'
        : daemonStatus.model_ready
          ? 'w-2 h-2 rounded-full bg-[var(--brand)]'
          : 'w-2 h-2 rounded-full bg-[var(--muted)]'

  const recLabel =
    !daemonStatus.model_ready
      ? 'Model loading…'
      : daemonStatus.status === 'recording'
        ? '● Recording…'
        : daemonStatus.status === 'transcribing'
          ? '⏳ Transcribing…'
          : 'Ready'

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Rec bar */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}
      >
        <div className={recDotCls} />
        <span className="font-mono text-[10px] text-[var(--dim)] flex-1">{recLabel}</span>
        <button
          onClick={onStart}
          disabled={!daemonStatus.model_ready || daemonStatus.status === 'recording' || daemonStatus.status === 'transcribing'}
          className="px-3 py-1 rounded-sm font-mono text-[10px] tracking-wider cursor-pointer border-none bg-[var(--seed-color)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
        >
          REC
        </button>
        <button
          onClick={onStop}
          disabled={daemonStatus.status !== 'recording'}
          className="px-3 py-1 rounded-sm font-mono text-[10px] tracking-wider cursor-pointer border-none bg-[var(--muted)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
        >
          STOP
        </button>
      </div>

      {/* New transcript button */}
      <button
        onClick={onNewTx}
        className="text-[11px] text-center py-2.5 font-mono tracking-widest text-[var(--text-dim)] cursor-pointer border-none bg-transparent hover:bg-[rgba(0,212,184,0.1)] hover:text-[var(--brand)] transition-colors flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        + NEW TRANSCRIPT
      </button>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {txList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 text-[var(--muted)] p-8">
            <span className="text-2xl opacity-25">♪</span>
            <p className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">No transcripts yet</p>
          </div>
        ) : (
          txList.map(t => {
            const dt = new Date(t.created_at.replace(' ', 'T'))
            const label = isNaN(dt.getTime()) ? t.created_at : dt.toLocaleString()
            const preview = (t.content ?? '').replace(/\n/g, ' ').substring(0, 80)
            const linked = t.node_uid ? ' • linked' : ''
            return (
              <div
                key={t.id}
                onClick={() => onSelectTx(t.id)}
                className={[
                  'px-3 py-3 cursor-pointer transition-colors',
                  t.id === selectedTxId
                    ? 'bg-[var(--brand-dim)] border-l-2 border-l-[var(--brand)] -ml-0.5'
                    : 'hover:bg-[var(--bg2)]',
                ].join(' ')}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="font-mono text-[9px] text-[var(--dim)] mb-0.5">
                  {label}{linked}
                </div>
                <div className="text-[11px] text-[var(--text)] leading-snug line-clamp-2">
                  {preview || '(empty)'}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
