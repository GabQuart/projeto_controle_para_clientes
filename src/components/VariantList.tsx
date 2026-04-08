import type { CatalogProduct, CatalogVariant } from '@/types/catalog'

type VariantListProps = {
  product: CatalogProduct
  onAction: (input: { product: CatalogProduct; variant: CatalogVariant }) => void
}

export function VariantList({ product, onAction }: VariantListProps) {
  if (product.variacoes.length === 0) {
    return <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-steel">Nenhuma variacao cadastrada para este produto.</p>
  }

  return (
    <div className="grid gap-3">
      {product.variacoes.map((variant) => (
        <div key={variant.id} className="rounded-2xl border border-black/10 bg-white/70 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="break-all text-sm font-bold text-ink">{variant.sku}</p>
              <p className="text-sm text-steel">
                {[variant.variacao || variant.cor, variant.tamanho].filter(Boolean).join(' | ') || 'Sem detalhamento adicional'}
              </p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => onAction({ product, variant })}
                className="rounded-full border border-pine/20 bg-pine/10 px-4 py-3 text-sm font-semibold text-pine transition hover:bg-pine/20"
              >
                Solicitar acao
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
