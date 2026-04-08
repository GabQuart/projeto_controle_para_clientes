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
  fotoDriveKind?: 'file' | 'folder'
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
  forceRefresh?: boolean
}

export type CatalogPagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type CatalogCacheMetadata = {
  updatedAt: string
  source: 'cache' | 'apps_script'
}
