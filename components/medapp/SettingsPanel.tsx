'use client'

import { useAppState } from '@/lib/store'
import type { Settings } from '@/lib/types'

interface Props {
  onSave: (partial: Partial<Settings>) => void
}

export default function SettingsPanel({ onSave }: Props) {
  const { state, dispatch } = useAppState()
  const s = state.settings

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    dispatch({ type: 'MERGE_SETTINGS', partial: { [key]: val } })
    onSave({ [key]: val })
  }

  const toggleCls = (active: boolean) =>
    `flex-1 py-1.5 rounded-sm text-[11px] text-center font-mono cursor-pointer border-none transition-all ${active ? 'bg-[var(--brand-dim)] text-[var(--brand)]' : 'bg-none text-[var(--dim)]'}`

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-3.5">
      {/* AI Backend */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">AI Backend</div>
        <div
          className="flex gap-0.5 rounded-sm p-0.5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border2)' }}
        >
          <button className={toggleCls(s.ai_backend !== 'gemini')} onClick={() => set('ai_backend', 'ollama')}>Ollama</button>
          <button className={toggleCls(s.ai_backend === 'gemini')} onClick={() => set('ai_backend', 'gemini')}>Gemini</button>
        </div>
      </div>

      {/* Ollama model */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">Ollama Model</div>
        <input
          className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-sm text-[var(--text)] py-1.5 px-2.5 text-[12px] font-mono outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_2px_var(--brand-dim)]"
          placeholder="ministral-3:3b"
          value={s.ollama_model ?? ''}
          onChange={e => set('ollama_model', e.target.value)}
        />
      </div>

      {/* Gemini model */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">Gemini Model</div>
        <input
          className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-sm text-[var(--text)] py-1.5 px-2.5 text-[12px] font-mono outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_2px_var(--brand-dim)]"
          placeholder="gemini-2.5-flash"
          value={s.gemini_model ?? ''}
          onChange={e => set('gemini_model', e.target.value)}
        />
      </div>

      {/* Gemini key */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">Gemini API Key</div>
        <input
          type="password"
          className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-sm text-[var(--text)] py-1.5 px-2.5 text-[12px] font-mono outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_2px_var(--brand-dim)]"
          placeholder="sk-…  (leave blank to keep existing)"
          onChange={e => set('gemini_api_key', e.target.value)}
        />
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Record mode */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">Record Mode</div>
        <div
          className="flex gap-0.5 rounded-sm p-0.5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border2)' }}
        >
          <button className={toggleCls(s.record_mode !== 'hold')} onClick={() => set('record_mode', 'toggle')}>Toggle</button>
          <button className={toggleCls(s.record_mode === 'hold')} onClick={() => set('record_mode', 'hold')}>Hold</button>
        </div>
      </div>

      {/* Remove fillers */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-[9px] font-medium text-[var(--dim)] uppercase tracking-widest">Remove Fillers</div>
        <div
          className="flex gap-0.5 rounded-sm p-0.5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border2)' }}
        >
          <button className={toggleCls(s.remove_fillers !== false)} onClick={() => set('remove_fillers', true)}>On</button>
          <button className={toggleCls(s.remove_fillers === false)} onClick={() => set('remove_fillers', false)}>Off</button>
        </div>
      </div>
    </div>
  )
}
