import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ProductRow, type PendingStatus } from '@/components/ProductRow'

type ProductTableProps = {
  products: CatalogProduct[]
  expandedIds: string[]
  onToggle: (skuBase: string) => void
  onAction: (input: { product: CatalogProduct; variant?: CatalogVariant; requestedAction: RequestedCatalogAction; quantity?: number }) => void
  pendingBySkuBase?: Record<string, PendingStatus>
}

export function ProductTable({ products, expandedIds, onToggle, onAction, pendingBySkuBase }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="panel rounded-3xl p-6 text-sm text-steel">
        Nenhum produto encontrado para os filtros atuais.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          expanded={expandedIds.includes(product.skuBase)}
          onToggle={() => onToggle(product.skuBase)}
          onAction={onAction}
          pendingStatus={pendingBySkuBase?.[product.skuBase]}
        />
      ))}
    </div>
  )
}
