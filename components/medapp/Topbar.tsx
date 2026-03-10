'use client'

import { useAppState } from '@/lib/store'

interface Props {
  onToggleRecording: () => void
}

export default function Topbar({ onToggleRecording }: Props) {
  const { state } = useAppState()
  const { daemonStatus, graphReady } = state
  const isRecording = daemonStatus.status === 'recording'
  const isTranscribing = daemonStatus.status === 'transcribing'

  return (
    <header
      className="h-11 flex items-center px-4 gap-4 flex-shrink-0 relative z-20"
      style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Dashed bottom accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 4px, transparent 4px, transparent 10px)' }}
      />

      <div
        className="font-display text-[15px] font-extrabold tracking-[0.02em] text-[var(--brand)]"
        style={{ textShadow: 'var(--brand-glow)' }}
      >
        Δ MedApp
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Status indicator */}
        <div
          className={`w-[7px] h-[7px] rounded-full transition-all ${graphReady ? 'bg-[var(--brand)] shadow-[var(--brand-glow)]' : 'bg-[var(--muted)]'}`}
        />
        <span className="font-mono text-[10px] text-[var(--dim)]">
          {graphReady ? 'graph ready' : 'loading…'}
        </span>

        {/* Recording badge */}
        {(isRecording || isTranscribing) && (
          <button
            onClick={onToggleRecording}
            title="Alt+R to toggle"
            className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-xl cursor-pointer border"
            style={{
              background: isRecording ? 'rgba(255,78,106,0.12)' : 'rgba(245,166,35,0.12)',
              borderColor: isRecording ? 'rgba(255,78,106,0.3)' : 'rgba(245,166,35,0.3)',
            }}
          >
            <div
              className={`w-2 h-2 rounded-full ${isRecording ? 'bg-[var(--seed-color)] animate-[blink_1s_step-start_infinite]' : 'bg-[var(--sibling-color)]'}`}
            />
            <span
              className="font-mono text-[10px] tracking-wider"
              style={{ color: isRecording ? '#ff4e6a' : '#f5a623' }}
            >
              {isRecording ? 'RECORDING' : 'TRANSCRIBING…'}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}
