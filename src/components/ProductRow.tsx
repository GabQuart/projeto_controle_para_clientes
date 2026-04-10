'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ActionSelector } from '@/components/ActionSelector'
import { ImagePreviewModal } from '@/components/ImagePreviewModal'
import { VariantList } from '@/components/VariantList'

type ProductRowProps = {
  product: CatalogProduct
  expanded: boolean
  onToggle: () => void
  onAction: (input: { product: CatalogProduct; variant?: CatalogVariant; requestedAction: RequestedCatalogAction; quantity?: number }) => void
}

function getProductPanelClassName(product: CatalogProduct) {
  if (product.status === 'inativo') {
    return 'panel rounded-[28px] border-white/15 bg-[linear-gradient(180deg,rgba(38,45,58,0.92),rgba(16,21,29,0.98))] p-4 opacity-90 sm:p-5'
  }

  if ((product.inactiveVariantCount ?? 0) > 0) {
    return 'panel rounded-[28px] border-amber/35 p-4 sm:p-5'
  }

  return 'panel rounded-[28px] p-4 sm:p-5'
}

function getProductStatusLabel(product: CatalogProduct) {
  if (product.status === 'inativo') {
    return { label: 'Produto inativo', className: 'border-white/15 bg-white/5 text-slate-300' }
  }

  if ((product.inactiveVariantCount ?? 0) > 0) {
    return { label: 'Produto parcialmente ativo', className: 'border-amber/35 bg-amber/10 text-amber' }
  }

  return { label: 'Produto ativo', className: 'border-pine/35 bg-pine/10 text-pine' }
}

export function ProductRow({ product, expanded, onToggle, onAction }: ProductRowProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const imageSrc = product.fotoRef || '/placeholder-product.svg'
  const initialGallery = Array.from(new Set([...(product.fotoGaleria ?? []), imageSrc].filter(Boolean))).slice(0, 3)
  const statusBadge = getProductStatusLabel(product)
  const isFullyInactive = product.status === 'inativo'

  return (
    <>
      <article className={getProductPanelClassName(product)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="brand-glow group relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-mist text-left transition hover:border-amber/30 sm:h-24 sm:w-24"
              aria-label={`Ampliar imagem de ${product.titulo}`}
            >
              <Image
                src={imageSrc}
                alt={product.titulo}
                fill
                sizes="(max-width: 640px) 100vw, 96px"
                className={`object-cover transition duration-300 group-hover:scale-[1.03] ${isFullyInactive ? 'grayscale opacity-70' : ''}`}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/35 to-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Ampliar
              </span>
            </button>
            <div className={`min-w-0 space-y-3 ${isFullyInactive ? 'opacity-85' : ''}`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isFullyInactive ? 'text-slate-400' : 'text-amber'}`}>{product.loja}</p>
                <h3 className={`font-display text-xl font-semibold tracking-[0.04em] ${isFullyInactive ? 'text-slate-200' : 'text-ink'}`}>{product.titulo}</h3>
              </div>
              <div className={`flex flex-wrap gap-2 text-xs sm:text-sm ${isFullyInactive ? 'text-slate-400' : 'text-steel'}`}>
                <span className={`rounded-full px-3 py-1 ${isFullyInactive ? 'border border-white/10 bg-white/[0.03]' : 'brand-chip'}`}>SKU catalogo: {product.skuBase}</span>
                <span className={`inline-flex rounded-full border px-3 py-1 font-semibold ${statusBadge.className}`}>{statusBadge.label}</span>
                {(product.inactiveVariantCount ?? 0) > 0 ? (
                  <span className="inline-flex rounded-full border border-amber/35 bg-amber/10 px-3 py-1 font-semibold text-amber">
                    {product.inactiveVariantCount} variacao(oes) inativa(s)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <ActionSelector onSelect={({ requestedAction, quantity }) => onAction({ product, requestedAction, quantity })} />
            <button
              type="button"
              onClick={onToggle}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                isFullyInactive
                  ? 'border border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:text-white'
                  : 'brand-chip text-ink hover:border-amber/40 hover:text-amber'
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`}>
                <path d="M12 15.5l-6-6 1.4-1.4 4.6 4.6 4.6-4.6L18 9.5l-6 6z" fill="currentColor" />
              </svg>
              <span>{expanded ? 'Recolher variacoes' : 'Ver variacoes'}</span>
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <VariantList
              product={product}
              onAction={({ variant, requestedAction, quantity }) => onAction({ product, variant, requestedAction, quantity })}
            />
          </div>
        ) : null}
      </article>
      <ImagePreviewModal
        open={previewOpen}
        skuBase={product.skuBase}
        initialImages={initialGallery}
        imageAlt={product.titulo}
        subtitle={`${product.skuBase} | ${product.loja}`}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}
