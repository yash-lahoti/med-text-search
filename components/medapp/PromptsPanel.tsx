'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import type { AIPrompt } from '@/lib/types'

interface Props {
  onSave: (payload: Partial<AIPrompt>) => void
  onDelete: (id: number) => void
}

export default function PromptsPanel({ onSave, onDelete }: Props) {
  const { state } = useAppState()
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [system, setSystem] = useState('')
  const [userTemplate, setUserTemplate] = useState('')
  const [schema, setSchema] = useState('')

  function clear() {
    setEditId(null)
    setName('')
    setSystem('')
    setUserTemplate('')
    setSchema('')
  }

  function editPrompt(p: AIPrompt) {
    setEditId(p.id)
    setName(p.name)
    setSystem(p.system_prompt)
    setUserTemplate(p.user_template)
    setSchema(p.json_schema ?? '')
  }

  function handleSave() {
    if (!name.trim() || !userTemplate.trim()) return alert('Name and User Template are required.')
    onSave({
      id: editId ?? undefined,
      name: name.trim(),
      system_prompt: system.trim(),
      user_template: userTemplate.trim(),
      json_schema: schema.trim(),
      use_structured: 0,
    })
    clear()
  }

  const inputCls = 'w-full bg-[var(--bg1)] border border-[var(--border2)] rounded text-[var(--text)] py-1.5 px-2.5 text-[12px] font-mono outline-none transition-colors focus:border-[var(--brand)] focus:shadow-[0_0_0_2px_var(--brand-dim)]'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
      <div className="font-display text-[11px] font-extrabold text-[var(--brand)] tracking-[0.15em] uppercase" style={{ textShadow: 'var(--brand-glow)' }}>
        PROMPT MANAGEMENT
      </div>

      {/* Form */}
      <div className="rounded-md p-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)]" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[9px] text-[var(--dim)] uppercase tracking-widest">NAME</div>
          <input className={inputCls} placeholder="e.g. Note Summarizer" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[9px] text-[var(--dim)] uppercase tracking-widest">SYSTEM PROMPT</div>
          <textarea rows={3} className={inputCls + ' resize-y min-h-[64px]'} placeholder="You are a medical assistant…" value={system} onChange={e => setSystem(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[9px] text-[var(--dim)] uppercase tracking-widest">USER TEMPLATE</div>
          <textarea rows={2} className={inputCls + ' resize-y'} placeholder="Summarize: {transcript}" value={userTemplate} onChange={e => setUserTemplate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[9px] text-[var(--dim)] uppercase tracking-widest">JSON SCHEMA (Optional)</div>
          <textarea rows={2} className={inputCls + ' resize-y'} placeholder={'{"properties": {"key": {"type": "string"}}}'} value={schema} onChange={e => setSchema(e.target.value)} />
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            className="flex-[2] py-1.5 px-3 text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm cursor-pointer border transition-all bg-[var(--brand)] text-[#080a0f] border-[var(--brand)] hover:brightness-110"
          >
            SAVE PROMPT
          </button>
          <button
            onClick={clear}
            className="flex-1 py-1.5 px-3 text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm cursor-pointer border text-[var(--text-dim)] border-[var(--border2)] bg-transparent hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="font-display text-[11px] font-extrabold text-[var(--brand)] tracking-[0.15em] uppercase" style={{ textShadow: 'var(--brand-glow)' }}>
        SAVED PROMPTS
      </div>

      {state.aiPrompts.length === 0 ? (
        <p className="font-mono text-[10px] text-center text-[var(--dim)]">No prompts saved yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {state.aiPrompts.map(p => (
            <div
              key={p.id}
              className="rounded-md p-3.5 flex flex-col gap-1.5 relative transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--bg1)', border: `1px solid ${editId === p.id ? 'var(--brand)' : 'var(--border2)'}`, ...(editId === p.id ? { boxShadow: '0 0 15px rgba(0,212,184,0.1)' } : {}) }}
            >
              <div className="font-semibold text-[13px] text-[var(--text)] tracking-[0.02em]">{p.name}</div>
              <div className="flex gap-3">
                <span className="font-mono text-[9px] uppercase tracking-wider bg-[rgba(0,212,184,0.1)] px-1.5 py-0.5 rounded">ID: {p.id}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => editPrompt(p)}
                  className="py-1.5 px-3 text-[9px] font-mono font-bold uppercase tracking-widest rounded-sm cursor-pointer border text-[var(--text-dim)] border-[var(--border2)] bg-transparent hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  EDIT
                </button>
                <button
                  onClick={() => { if (confirm('Delete this prompt?')) onDelete(p.id) }}
                  className="py-1.5 px-3 text-[9px] font-mono font-bold uppercase tracking-widest rounded-sm cursor-pointer border text-[var(--seed-color)] border-[rgba(255,78,106,0.4)] bg-transparent hover:bg-[rgba(255,78,106,0.1)]"
                >
                  DEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
