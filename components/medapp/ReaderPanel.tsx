'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'

interface Props {
  onSaveUserNode: (uid: string, text: string) => void
  onZoom: (delta: number) => void
  onCopyText: () => void
  onTriggerImageUpload: () => void
  imageUploadRef: React.RefObject<HTMLInputElement | null>
  onImageFileSelected: (file: File) => void
}

export default function ReaderPanel({
  onSaveUserNode, onZoom, onCopyText, onTriggerImageUpload, imageUploadRef, onImageFileSelected
}: Props) {
  const { state } = useAppState()
  const n = state.activeNode

  if (!n) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2.5 text-[var(--muted)] p-8">
        <span className="text-4xl opacity-25">📄</span>
        <p className="font-mono text-[11px] text-center leading-7 text-[var(--dim)]">
          Select a node to view the textbook page
        </p>
      </div>
    )
  }

  if (n.is_user) {
    return <UserNodeEditor node={n} onSave={onSaveUserNode} />
  }

  if (n.pdf_pages_b64 && n.pdf_pages_b64.length > 0) {
    return <PdfViewer node={n} zoom={state.currentPdfZoom} onZoom={onZoom} />
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
      <div className="w-full max-w-[860px]">
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
        >
          <div className="font-display text-[14px] font-bold tracking-wider uppercase text-[var(--brand)] mb-2">
            {n.title}
          </div>
          <div className="text-[13px] leading-[1.7] text-[var(--text)] whitespace-pre-wrap">
            {n.text ?? 'No content yet.'}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserNodeEditor({ node, onSave }: { node: import('@/lib/types').FullNode; onSave: (uid: string, text: string) => void }) {
  const [text, setText] = useState(node.text ?? '')
  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
      <div className="w-full max-w-[860px]">
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.25)' }}
        >
          <div className="font-display text-[14px] font-bold tracking-wider uppercase text-[var(--brand)]">
            {node.title}
          </div>
          <textarea
            className="w-full min-h-[160px] text-[var(--text)] font-mono text-[12px] p-2.5 resize-y outline-none rounded"
            style={{ background: '#020617', border: '1px solid var(--border2)' }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={() => onSave(node.uid, text)}
              className="py-2 px-4 rounded-sm font-mono text-[11px] tracking-wider cursor-pointer border bg-[var(--brand)] text-[#080a0f] border-[var(--brand)] hover:brightness-110"
            >
              SAVE NODE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PdfViewer({ node, zoom, onZoom }: { node: import('@/lib/types').FullNode; zoom: number; onZoom: (d: number) => void }) {
  const startPage = Math.max(1, (node.page ?? 1) - 1)
  return (
    <div className="flex-1 relative flex flex-col overflow-hidden" style={{ background: 'var(--bg2)' }}>
      {/* Controls */}
      <div
        className="absolute top-3.5 right-4 flex gap-1 z-10 rounded p-0.5"
        style={{ background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(8px)', border: '1px solid var(--border2)' }}
      >
        {[
          { label: '+', delta: 10 },
          { label: 'RESET', delta: 0 },
          { label: '-', delta: -10 },
        ].map(b => (
          <button
            key={b.label}
            onClick={() => onZoom(b.delta)}
            className="w-6.5 h-6.5 rounded-sm cursor-pointer flex items-center justify-center font-mono text-[13px] text-[var(--text)] bg-transparent border-none hover:bg-[var(--bg)] hover:text-[var(--brand)] transition-colors"
            style={{ width: b.label === 'RESET' ? 'auto' : 26, height: 26, padding: '0 4px' }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
        <div className="flex flex-col items-center gap-5 pb-10" style={{ width: `${zoom}%`, maxWidth: 860, transition: 'width 0.15s' }}>
          {(node.pdf_pages_b64 ?? []).map((b64, idx) => {
            const pageNum = startPage + idx
            const isTarget = pageNum === node.page
            return (
              <div key={idx} className="w-full flex flex-col items-center gap-0">
                <div
                  className="font-mono text-[9px] uppercase tracking-widest mb-[-12px]"
                  style={{ color: isTarget ? 'var(--brand)' : 'var(--dim)', fontWeight: isTarget ? 'bold' : 'normal' }}
                >
                  Page {pageNum}
                </div>
                <img
                  id={isTarget ? 'target-pdf-page' : undefined}
                  className="w-full rounded-sm"
                  style={{ border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                  src={`data:image/png;base64,${b64}`}
                  alt={`Page ${pageNum}`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
