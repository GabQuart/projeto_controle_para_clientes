'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ActionSelector } from '@/components/ActionSelector'
import { ImagePreviewModal } from '@/components/ImagePreviewModal'
import { useTranslations } from '@/components/providers/LocaleProvider'
import { VariantList, type PendingVariantStatus } from '@/components/VariantList'

export type PendingStatus = 'ativacao' | 'inativacao' | 'ambos'

type ProductRowProps = {
  product: CatalogProduct
  expanded: boolean
  onToggle: () => void
  onAction: (input: { product: CatalogProduct; variant?: CatalogVariant; requestedAction: RequestedCatalogAction; quantity?: number }) => void
  pendingStatus?: PendingStatus
  pendingVariantSkus?: Record<string, PendingVariantStatus>
}

function getProductPanelClassName(product: CatalogProduct, pendingStatus?: PendingStatus) {
  if (product.status === 'inativo') {
    return 'panel rounded-[28px] border-white/15 bg-[linear-gradient(180deg,rgba(38,45,58,0.92),rgba(16,21,29,0.98))] p-4 opacity-90 sm:p-5'
  }

  if (pendingStatus) {
    return 'panel rounded-[28px] border-[#ffd54a]/60 shadow-[0_0_22px_rgba(255,213,74,0.12)] p-4 sm:p-5'
  }

  if ((product.inactiveVariantCount ?? 0) > 0) {
    return 'panel rounded-[28px] border-amber/35 p-4 sm:p-5'
  }

  return 'panel rounded-[28px] p-4 sm:p-5'
}

function getProductStatusLabel(product: CatalogProduct) {
  if (product.status === 'inativo') {
    return { key: 'productRow.productInactive', className: 'border-white/15 bg-white/5 text-slate-300' }
  }

  if ((product.inactiveVariantCount ?? 0) > 0) {
    return { key: 'productRow.productPartial', className: 'border-amber/35 bg-amber/10 text-amber' }
  }

  return { key: 'productRow.productActive', className: 'border-pine/35 bg-pine/10 text-pine' }
}

export function ProductRow({ product, expanded, onToggle, onAction, pendingStatus, pendingVariantSkus }: ProductRowProps) {
  const t = useTranslations()
  const [previewOpen, setPreviewOpen] = useState(false)
  const imageSrc = product.fotoRef || '/placeholder-product.svg'
  const pendingVariantCount = pendingVariantSkus ? Object.keys(pendingVariantSkus).filter((sku) =>
    product.variacoes.some((v) => v.sku === sku)
  ).length : 0
  const initialGallery = Array.from(new Set([...(product.fotoGaleria ?? []), imageSrc].filter(Boolean))).slice(0, 3)
  const statusBadge = getProductStatusLabel(product)
  const isFullyInactive = product.status === 'inativo'

  return (
    <>
      <article className={getProductPanelClassName(product, pendingStatus)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="brand-glow group relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-mist text-left transition hover:border-amber/30 sm:h-24 sm:w-24"
              aria-label={t('productRow.expandImage', { title: product.titulo })}
            >
              <Image
                src={imageSrc}
                alt={product.titulo}
                fill
                sizes="(max-width: 640px) 100vw, 96px"
                className={`object-cover transition duration-300 group-hover:scale-[1.03] ${isFullyInactive ? 'grayscale opacity-70' : ''}`}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/35 to-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {t('productRow.zoom')}
              </span>
            </button>
            <div className={`min-w-0 space-y-3 ${isFullyInactive ? 'opacity-85' : ''}`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isFullyInactive ? 'text-slate-400' : 'text-amber'}`}>{product.loja}</p>
                <h3 className={`font-display text-xl font-semibold tracking-[0.04em] ${isFullyInactive ? 'text-slate-200' : 'text-ink'}`}>{product.titulo}</h3>
              </div>
              <div className={`flex flex-wrap gap-2 text-xs sm:text-sm ${isFullyInactive ? 'text-slate-400' : 'text-steel'}`}>
                <span className={`rounded-full px-3 py-1 ${isFullyInactive ? 'border border-white/10 bg-white/[0.03]' : 'brand-chip'}`}>{t('productRow.catalogSku', { sku: product.skuBase })}</span>
                <span className={`inline-flex rounded-full border px-3 py-1 font-semibold ${statusBadge.className}`}>{t(statusBadge.key)}</span>
                {(product.inactiveVariantCount ?? 0) > 0 ? (
                  <span className="inline-flex rounded-full border border-amber/35 bg-amber/10 px-3 py-1 font-semibold text-amber">
                    {t('productRow.inactiveVariants', { count: product.inactiveVariantCount ?? 0 })}
                  </span>
                ) : null}
                {pendingVariantCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd54a]/55 bg-[#ffd54a]/12 px-3 py-1 font-semibold text-[#ffd54a] shadow-[0_0_12px_rgba(255,213,74,0.15)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffd54a] animate-pulse" />
                    {t('productRow.pendingVariants', { count: pendingVariantCount })}
                  </span>
                ) : null}
                {(pendingStatus === 'ativacao' || pendingStatus === 'ambos') ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd54a]/55 bg-[#ffd54a]/12 px-3 py-1 text-[#ffd54a] font-semibold shadow-[0_0_12px_rgba(255,213,74,0.15)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffd54a] animate-pulse" />
                    {t('productRow.pendingActivation')}
                  </span>
                ) : null}
                {(pendingStatus === 'inativacao' || pendingStatus === 'ambos') ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd54a]/55 bg-[#ffd54a]/12 px-3 py-1 text-[#ffd54a] font-semibold shadow-[0_0_12px_rgba(255,213,74,0.15)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffd54a] animate-pulse" />
                    {t('productRow.pendingDeactivation')}
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
              <span>{expanded ? t('productRow.collapseVariants') : t('productRow.showVariants')}</span>
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <VariantList
              product={product}
              onAction={({ variant, requestedAction, quantity }) => onAction({ product, variant, requestedAction, quantity })}
              pendingVariantSkus={pendingVariantSkus}
            />
          </div>
        ) : null}
      </article>
      <ImagePreviewModal
        open={previewOpen}
        skuBase={product.skuBase}
        initialImages={initialGallery}
        imageAlt={product.titulo}
        subtitle={t('productRow.previewSubtitle', { sku: product.skuBase, store: product.loja })}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}
