'use client'

import { useAppState } from '@/lib/store'
import GraphPanel from './GraphPanel'
import ReaderPanel from './ReaderPanel'

interface Props {
  onSelectNode: (uid: string) => void
  onSaveUserNode: (uid: string, text: string) => void
  onZoom: (delta: number) => void
  onCopyText: () => void
  onTriggerImageUpload: () => void
  imageUploadRef: React.RefObject<HTMLInputElement | null>
  onImageFileSelected: (file: File) => void
  onOpenLightbox: (src: string) => void
}

export default function SidePanel({
  onSelectNode, onSaveUserNode, onZoom, onCopyText,
  onTriggerImageUpload, imageUploadRef, onImageFileSelected, onOpenLightbox,
}: Props) {
  const { state } = useAppState()
  const n = state.activeNode

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col" style={{ background: 'var(--bg1)' }}>
      {/* D3 Graph (upper half) */}
      <GraphPanel onSelectNode={onSelectNode} />

      {/* Images (lower portion) */}
      <div className="flex-[0_0_200px] flex flex-col overflow-hidden">
        <div
          className="px-3.5 py-1.5 flex-shrink-0 flex justify-between items-center font-mono text-[9px] tracking-widest text-[var(--dim)] uppercase"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg1)' }}
        >
          <span>IMAGES</span>
          <div className="flex gap-1.5">
            {state.activeNodeRawText && (
              <button
                onClick={onCopyText}
                className="px-2.5 py-0.5 rounded font-mono text-[9px] cursor-pointer transition-all hover:bg-[var(--brand)] hover:text-[#080a0f]"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid rgba(0,212,184,0.25)' }}
              >
                COPY TEXT
              </button>
            )}
            {n?.is_user && (
              <>
                <button
                  onClick={onTriggerImageUpload}
                  className="px-2.5 py-0.5 rounded font-mono text-[9px] cursor-pointer transition-all hover:bg-[var(--brand)] hover:text-[#080a0f]"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid rgba(0,212,184,0.25)' }}
                >
                  ADD IMAGE
                </button>
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) onImageFileSelected(f)
                    e.target.value = ''
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 content-start">
          {n?.resolved_images && n.resolved_images.length > 0 ? (
            n.resolved_images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Media ${i + 1}`}
                onClick={() => onOpenLightbox(src)}
                className="w-full rounded-sm cursor-zoom-in transition-colors hover:border-[var(--brand)]"
                style={{ border: '1px solid var(--border)' }}
              />
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center gap-1.5 p-2.5">
              <span className="text-2xl opacity-25">⬜</span>
              <span className="text-[10px] text-[var(--dim)]">no media</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
