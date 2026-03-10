'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import type { SearchResult } from '@/lib/types'

interface Props {
  onSearch: (q: string) => void
  onSelectNode: (uid: string) => void
  onClear: () => void
  loading: boolean
}

const roleCls: Record<string, string> = {
  seed: 'bg-[rgba(255,78,106,0.14)] text-[var(--seed-color)] shadow-[0_0_6px_rgba(255,78,106,0.15)]',
  parent: 'bg-[rgba(0,212,184,0.12)] text-[var(--parent-color)] shadow-[0_0_6px_rgba(0,212,184,0.12)]',
  sibling: 'bg-[rgba(245,166,35,0.14)] text-[var(--sibling-color)]',
  semantic: 'bg-[rgba(168,85,247,0.14)] text-[var(--sem-color)]',
}

export default function SearchView({ onSearch, onSelectNode, onClear, loading }: Props) {
  const { state } = useAppState()
  const [query, setQuery] = useState('')

  const nodes = state.currentGraphBundle?.nodes ?? []

  function handleSearch() {
    if (query.trim()) onSearch(query.trim())
  }

  function handleClear() {
    setQuery('')
    onClear()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--dim)] mb-2">
          <span>QUERY</span>
          <span className="text-[9px]">embed → expand → context</span>
        </div>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
          rows={3}
          placeholder="e.g. postpartum hemorrhage management"
          className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-sm text-[var(--text)] font-mono text-[12px] px-2.5 py-2 outline-none transition-colors resize-y min-h-[72px] max-h-[180px] focus:border-[var(--brand)] focus:shadow-[0_0_0_2px_var(--brand-dim)]"
        />
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleSearch}
            disabled={!state.graphReady || loading}
            className="flex-1 py-2 rounded-sm font-mono text-[11px] tracking-wider cursor-pointer border transition-all bg-[var(--brand)] text-[#080a0f] border-[var(--brand)] disabled:bg-[var(--muted)] disabled:border-[var(--muted)] disabled:cursor-not-allowed hover:brightness-110"
          >
            {loading ? 'SEARCHING…' : 'SEARCH'}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2 rounded-sm font-mono text-[11px] tracking-wider cursor-pointer border text-[var(--text-dim)] border-[var(--border2)] bg-transparent hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="spinner" />
        ) : nodes.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center gap-2.5 text-[var(--muted)] p-8">
            <span className="text-3xl opacity-25">◎</span>
            <p className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">
              Run a semantic search<br />to explore the knowledge graph
            </p>
          </div>
        ) : (
          nodes.map(n => (
            <div
              key={n.uid}
              id={`search-result-${n.uid.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
              onClick={() => onSelectNode(n.uid)}
              className={[
                'px-4 py-2.5 cursor-pointer transition-colors flex gap-2.5 items-start',
                state.selectedUid === n.uid
                  ? 'bg-[var(--brand-dim)] border-l-2 border-l-[var(--brand)] -ml-0.5'
                  : 'hover:bg-[var(--bg2)]',
              ].join(' ')}
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div
                className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded-xl uppercase flex-shrink-0 mt-0.5 font-medium ${roleCls[n.role] ?? ''}`}
              >
                {n.role}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[var(--text)] truncate mb-0.5">{n.title}</div>
                <div className="font-mono text-[10px] text-[var(--dim)] truncate mb-1">
                  {n.subject} › {n.path.replace(/ > /g, ' › ')}
                </div>
                <div className="text-[11px] text-[var(--text-dim)] leading-relaxed line-clamp-2">
                  {(n.text ?? '').substring(0, 120)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
