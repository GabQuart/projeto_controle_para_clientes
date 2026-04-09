'use client'

import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import Image from 'next/image'

type ImagePreviewModalProps = {
  open: boolean
  skuBase: string
  initialImages: string[]
  imageAlt: string
  subtitle?: string
  onClose: () => void
}

export function ImagePreviewModal({
  open,
  skuBase,
  initialImages,
  imageAlt,
  subtitle,
  onClose,
}: ImagePreviewModalProps) {
  const [images, setImages] = useState<string[]>(() => initialImages.filter(Boolean))
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const touchStartXRef = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 48

  const safeImages = useMemo(() => {
    const normalized = Array.from(new Set(images.filter(Boolean)))
    return normalized.length > 0 ? normalized : ['/placeholder-product.svg']
  }, [images])

  useEffect(() => {
    setImages(initialImages.filter(Boolean))
  }, [initialImages])

  useEffect(() => {
    setActiveIndex((currentIndex) => Math.min(currentIndex, Math.max(safeImages.length - 1, 0)))
  }, [safeImages.length])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((currentIndex) => (currentIndex + 1) % safeImages.length)
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((currentIndex) => (currentIndex - 1 + safeImages.length) % safeImages.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open, safeImages.length])

  useEffect(() => {
    if (!open || !skuBase) {
      return
    }

    let cancelled = false

    async function loadGallery() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/catalogo/galeria?skuBase=${encodeURIComponent(skuBase)}`, {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Nao foi possivel carregar as imagens do produto.')
        }

        if (!cancelled) {
          const nextImages = Array.isArray(payload.data) ? payload.data.filter(Boolean) : []
          if (nextImages.length > 0) {
            setImages(nextImages)
          }
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar a galeria do produto.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadGallery()

    return () => {
      cancelled = true
    }
  }, [open, skuBase])

  if (!open) {
    return null
  }

  const activeImage = safeImages[activeIndex] || '/placeholder-product.svg'

  function goToPreviousImage() {
    setActiveIndex((currentIndex) => (currentIndex - 1 + safeImages.length) % safeImages.length)
  }

  function goToNextImage() {
    setActiveIndex((currentIndex) => (currentIndex + 1) % safeImages.length)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStartX = touchStartXRef.current
    const touchEndX = event.changedTouches[0]?.clientX ?? null

    touchStartXRef.current = null

    if (touchStartX === null || touchEndX === null || safeImages.length <= 1) {
      return
    }

    const deltaX = touchEndX - touchStartX

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return
    }

    if (deltaX < 0) {
      goToNextImage()
      return
    }

    goToPreviousImage()
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

        <div className="space-y-4 bg-[radial-gradient(circle_at_top,rgba(88,200,255,0.18),transparent_40%),linear-gradient(180deg,rgba(5,12,21,0.96),rgba(4,9,19,0.98))] p-3 sm:p-5">
          <div
            className="relative min-h-[280px] touch-pan-y overflow-hidden rounded-[24px] border border-white/10 bg-black/20 sm:min-h-[520px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image src={activeImage} alt={imageAlt} fill sizes="100vw" className="object-contain" priority />
            {safeImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="brand-chip absolute left-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-3 text-sm font-semibold text-ink"
                  aria-label="Imagem anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="brand-chip absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-3 text-sm font-semibold text-ink"
                  aria-label="Proxima imagem"
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-steel">
              {loading ? 'Carregando imagens adicionais...' : `Imagem ${activeIndex + 1} de ${safeImages.length}`}
              {error ? <p className="mt-1 text-clay">{error}</p> : null}
              {safeImages.length > 1 ? <p className="mt-1 text-xs text-steel/80 sm:hidden">Deslize para o lado para trocar a imagem.</p> : null}
            </div>
            {safeImages.length > 1 ? (
              <div className="brand-scrollbar flex gap-2 overflow-x-auto pb-1">
                {safeImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition ${
                      index === activeIndex ? 'border-amber shadow-[0_0_18px_rgba(88,200,255,0.25)]' : 'border-white/10'
                    }`}
                    aria-label={`Abrir imagem ${index + 1}`}
                  >
                    <Image src={image} alt={`${imageAlt} ${index + 1}`} fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
