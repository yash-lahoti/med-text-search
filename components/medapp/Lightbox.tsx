'use client'

import { useEffect } from 'react'
import { useAppState } from '@/lib/store'

export default function Lightbox() {
  const { state, dispatch } = useAppState()
  const src = state.lightboxSrc

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && src) dispatch({ type: 'SET_LIGHTBOX', src: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, dispatch])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 bg-black/92 z-[1000] flex items-center justify-center cursor-zoom-out"
      onClick={() => dispatch({ type: 'SET_LIGHTBOX', src: null })}
    >
      <img
        src={src}
        alt="Lightbox"
        className="max-w-[90vw] max-h-[90vh] rounded-sm"
        style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.7)' }}
      />
    </div>
  )
}
