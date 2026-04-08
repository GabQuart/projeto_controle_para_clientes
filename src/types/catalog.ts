export type CatalogVariant = {
  id: string
  sku: string
  skuBase: string
  variacao?: string
  cor?: string
  tamanho?: string
  ativo?: boolean
}

export type CatalogProduct = {
  id: string
  clienteCod: string
  loja: string
  skuBase: string
  titulo: string
  fotoRef?: string
  fotoFileId?: string
  cores?: string[]
  tamanhos?: string[]
  ativo?: boolean
  variacoes: CatalogVariant[]
}

export type CatalogQuery = {
  clienteCod?: string
  termo?: string
  page?: number
  pageSize?: number
}

export type CatalogPagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}
