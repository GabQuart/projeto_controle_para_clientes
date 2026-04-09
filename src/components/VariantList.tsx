'use client'

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
  return (
    <div className="brand-chip rounded-2xl p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-ink">{variant.sku}</p>
          <p className="text-sm text-steel">
            {[variant.variacao || variant.cor, variant.tamanho].filter(Boolean).join(' | ') || 'Sem detalhamento adicional'}
          </p>
        </div>
        <ActionSelector onSelect={(requestedAction) => onAction({ product, variant, requestedAction })} />
      </div>
    </div>
  )
}

export function VariantList({ product, onAction }: VariantListProps) {
  if (product.variacoes.length === 0) {
    return <p className="brand-chip rounded-2xl px-4 py-3 text-sm text-steel">Nenhuma variacao cadastrada para este produto.</p>
  }

  return (
    <div className="grid gap-3">
      {product.variacoes.map((variant) => (
        <VariantActionRow key={variant.id} product={product} variant={variant} onAction={onAction} />
      ))}
    </div>
  )
}
