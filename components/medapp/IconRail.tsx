'use client'

import { useAppState } from '@/lib/store'
import type { LeftTab } from '@/lib/types'

const TABS: { id: LeftTab; tip: string; icon: React.ReactNode }[] = [
  {
    id: 'tree',
    tip: 'TREE',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth={1.6}>
        <path d="M3 3h5v5H3zM16 3h5v5h-5zM9.5 5.5h5M12 8v4m0 4h.01M7 12h-4M21 12h-4M12 20v-4" />
      </svg>
    ),
  },
  {
    id: 'search',
    tip: 'SEARCH',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth={1.6}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
]

const BOTTOM_TABS: { id: LeftTab; tip: string; icon: React.ReactNode }[] = [
  {
    id: 'transcripts',
    tip: 'TRANSCRIPTS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth={1.6}>
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
      </svg>
    ),
  },
  {
    id: 'settings',
    tip: 'SETTINGS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    id: 'prompts',
    tip: 'PROMPTS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth={1.6}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
]

interface Props {
  onTabChange: (tab: LeftTab) => void
}

export default function IconRail({ onTabChange }: Props) {
  const { state, dispatch } = useAppState()

  function setTab(tab: LeftTab) {
    dispatch({ type: 'SET_LEFT_TAB', tab })
    onTabChange(tab)
  }

  const btnCls = (active: boolean) =>
    [
      'relative w-10 h-10 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all duration-150 group',
      active
        ? 'text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(0,212,184,0.2)]'
        : 'text-[var(--dim)] hover:text-[var(--text)]',
    ].join(' ')

  const bgStyle = (active: boolean) =>
    active ? { background: 'var(--brand-dim)' } : { background: 'transparent' }

  const recStatus = state.daemonStatus.status
  const recDotCls =
    recStatus === 'recording'
      ? 'w-2 h-2 rounded-full bg-[var(--seed-color)] shadow-[0_0_8px_#ff4e6a] animate-[blink_1s_step-start_infinite]'
      : recStatus === 'transcribing'
        ? 'w-2 h-2 rounded-full bg-[var(--sibling-color)]'
        : recStatus === 'idle' && state.daemonStatus.model_ready
          ? 'w-2 h-2 rounded-full bg-[var(--brand)]'
          : 'w-2 h-2 rounded-full bg-[var(--muted)]'

  return (
    <nav
      style={{ background: 'var(--bg1)', borderRight: '1px solid var(--border)' }}
      className="w-14 flex-shrink-0 flex flex-col items-center py-2 gap-0.5 z-10"
    >
      {TABS.map(t => (
        <button
          key={t.id}
          style={bgStyle(state.leftTab === t.id)}
          className={btnCls(state.leftTab === t.id)}
          onClick={() => setTab(t.id)}
          aria-label={t.tip}
        >
          {t.icon}
          <span
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
            className="absolute left-[52px] top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--text)] px-2.5 py-1 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
          >
            {t.tip}
          </span>
        </button>
      ))}

      <div className="w-7 h-px my-2" style={{ background: 'var(--border)' }} />

      {BOTTOM_TABS.map(t => (
        <button
          key={t.id}
          style={bgStyle(state.leftTab === t.id)}
          className={btnCls(state.leftTab === t.id)}
          onClick={() => setTab(t.id)}
          aria-label={t.tip}
        >
          {t.icon}
          <span
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
            className="absolute left-[52px] top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--text)] px-2.5 py-1 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
          >
            {t.tip}
          </span>
        </button>
      ))}

      <div className="mt-auto mb-2.5">
        <div className={recDotCls} title="Recording status" />
      </div>
    </nav>
  )
}
