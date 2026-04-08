'use client'

import { useState } from 'react'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ActionSelector } from '@/components/ActionSelector'

type VariantListProps = {
  product: CatalogProduct
  onAction: (input: { product: CatalogProduct; variant: CatalogVariant; requestedAction: RequestedCatalogAction }) => void
}

function VariantActionRow({
  product,
  variant,
  onAction,
}: {
  product: CatalogProduct
  variant: CatalogVariant
  onAction: (input: { product: CatalogProduct; variant: CatalogVariant; requestedAction: RequestedCatalogAction }) => void
}) {
  const [requestedAction, setRequestedAction] = useState<RequestedCatalogAction>(variant.ativo ? 'inativar' : 'ativar')

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="break-all text-sm font-bold text-ink">{variant.sku}</p>
          <p className="text-sm text-steel">
            {[variant.variacao || variant.cor, variant.tamanho].filter(Boolean).join(' | ') || 'Sem detalhamento adicional'}
          </p>
        </div>
        <ActionSelector
          value={requestedAction}
          onChange={setRequestedAction}
          onSubmit={() => onAction({ product, variant, requestedAction })}
          buttonLabel="Abrir"
        />
      </div>
    </div>
  )
}

export function VariantList({ product, onAction }: VariantListProps) {
  if (product.variacoes.length === 0) {
    return <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-steel">Nenhuma variacao cadastrada para este produto.</p>
  }

  return (
    <div className="grid gap-3">
      {product.variacoes.map((variant) => (
        <VariantActionRow key={variant.id} product={product} variant={variant} onAction={onAction} />
      ))}
    </div>
  )
}
