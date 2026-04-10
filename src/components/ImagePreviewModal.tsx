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

  useEffect(() => {
    if (!open || safeImages.length <= 1) {
      return
    }

    const nextIndex = (activeIndex + 1) % safeImages.length
    const previousIndex = (activeIndex - 1 + safeImages.length) % safeImages.length
    const preloadTargets = [safeImages[nextIndex], safeImages[previousIndex]].filter(Boolean)

    preloadTargets.forEach((src) => {
      const image = new window.Image()
      image.src = src
    })
  }, [activeIndex, open, safeImages])

  if (!open) {
    return null
  }

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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-night/90 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="panel brand-glow flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">Visualizacao da imagem</p>
              <h2 className="truncate font-display text-base font-semibold text-ink sm:text-2xl">{imageAlt}</h2>
              {subtitle ? <p className="mt-1 text-xs text-steel sm:text-sm">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="brand-scrollbar flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(88,200,255,0.18),transparent_40%),linear-gradient(180deg,rgba(5,12,21,0.96),rgba(4,9,19,0.98))] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:space-y-4 sm:p-5">
          <div
            className="relative h-[clamp(220px,42dvh,520px)] min-h-[220px] touch-pan-y overflow-hidden rounded-[24px] border border-white/10 bg-black/20 sm:h-[clamp(360px,64vh,760px)]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {safeImages.map((image, index) => (
                <div key={`${image}-${index}`} className="relative h-full min-w-full">
                  <Image
                    src={image}
                    alt={`${imageAlt} ${index + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority={index === activeIndex}
                  />
                </div>
              ))}
            </div>
            {safeImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="brand-chip absolute left-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-3 text-sm font-semibold text-ink sm:left-3"
                  aria-label="Imagem anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="brand-chip absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-3 text-sm font-semibold text-ink sm:right-3"
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
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border transition sm:h-16 sm:w-16 ${
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
