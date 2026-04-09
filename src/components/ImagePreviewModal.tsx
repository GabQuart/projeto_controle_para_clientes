'use client'

import { useEffect } from 'react'
import Image from 'next/image'

type ImagePreviewModalProps = {
  open: boolean
  imageSrc: string
  imageAlt: string
  subtitle?: string
  onClose: () => void
}

export function ImagePreviewModal({ open, imageSrc, imageAlt, subtitle, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night/90 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="panel brand-glow w-full max-w-5xl overflow-hidden rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">Visualizacao da imagem</p>
            <h2 className="truncate font-display text-lg font-semibold text-ink sm:text-2xl">{imageAlt}</h2>
            {subtitle ? <p className="mt-1 text-sm text-steel">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink"
          >
            Fechar
          </button>
        </div>

        <div className="bg-[radial-gradient(circle_at_top,rgba(88,200,255,0.18),transparent_40%),linear-gradient(180deg,rgba(5,12,21,0.96),rgba(4,9,19,0.98))] p-3 sm:p-5">
          <div className="relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/10 bg-black/20 sm:min-h-[520px]">
            <Image src={imageSrc} alt={imageAlt} fill sizes="100vw" className="object-contain" priority />
          </div>
        </div>
      </div>
    </div>
  )
}
