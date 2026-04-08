'use client'

import { useState } from 'react'
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
  const [requestedAction, setRequestedAction] = useState<RequestedCatalogAction>('inativar')

  return (
    <article className="panel rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-mist sm:h-24 sm:w-24">
            <Image
              src={product.fotoRef || '/placeholder-product.svg'}
              alt={product.titulo}
              fill
              sizes="(max-width: 640px) 100vw, 96px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-steel">{product.loja}</p>
              <h3 className="text-base font-black text-ink sm:text-lg">{product.titulo}</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
              <span className="rounded-full bg-ink/5 px-3 py-1">SKU base: {product.skuBase}</span>
              <span className="rounded-full bg-ink/5 px-3 py-1">Cliente: {product.clienteCod}</span>
              <span className="rounded-full bg-ink/5 px-3 py-1">Variacoes: {product.variacoes.length}</span>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <ActionSelector
            value={requestedAction}
            onChange={setRequestedAction}
            onSubmit={() => onAction({ product, requestedAction })}
            buttonLabel="Abrir acao"
          />
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            {expanded ? 'Recolher variacoes' : 'Ver variacoes'}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-4 border-t border-black/10 pt-4">
          <VariantList product={product} onAction={({ variant, requestedAction: nextAction }) => onAction({ product, variant, requestedAction: nextAction })} />
        </div>
      ) : null}
    </article>
  )
}
