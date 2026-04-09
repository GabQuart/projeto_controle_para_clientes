'use client'

import Image from 'next/image'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ActionSelector } from '@/components/ActionSelector'
import { VariantList } from '@/components/VariantList'

type ProductRowProps = {
  product: CatalogProduct
  expanded: boolean
  onToggle: () => void
  onAction: (input: { product: CatalogProduct; variant?: CatalogVariant; requestedAction: RequestedCatalogAction }) => void
}

export function ProductRow({ product, expanded, onToggle, onAction }: ProductRowProps) {
  return (
    <article className="panel rounded-[28px] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="brand-glow relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-mist sm:h-24 sm:w-24">
            <Image
              src={product.fotoRef || '/placeholder-product.svg'}
              alt={product.titulo}
              fill
              sizes="(max-width: 640px) 100vw, 96px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber">{product.loja}</p>
              <h3 className="font-display text-xl font-semibold tracking-[0.04em] text-ink">{product.titulo}</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
              <span className="brand-chip rounded-full px-3 py-1">SKU base: {product.skuBase}</span>
              <span className="brand-chip rounded-full px-3 py-1">Cliente: {product.clienteCod}</span>
              <span className="brand-chip rounded-full px-3 py-1">Variacoes: {product.variacoes.length}</span>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <ActionSelector onSelect={(requestedAction) => onAction({ product, requestedAction })} />
          <button
            type="button"
            onClick={onToggle}
            className="brand-chip inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
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
            onAction={({ variant, requestedAction }) => onAction({ product, variant, requestedAction })}
          />
        </div>
      ) : null}
    </article>
  )
}
