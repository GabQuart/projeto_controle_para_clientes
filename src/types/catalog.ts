export type CatalogVariant = {
  id: string
  sku: string
  skuBase: string
  variacao?: string
  cor?: string
  tamanho?: string
  ativo?: boolean
  status?: 'ativo' | 'inativo'
}

export type CatalogProduct = {
  id: string
  clienteCod: string
  loja: string
  skuBase: string
  prefixoSku?: string
  titulo: string
  fotoRef?: string
  fotoFileId?: string
  fotoDriveKind?: 'file' | 'folder'
  fotoGaleria?: string[]
  fotoGaleriaFileIds?: string[]
  cores?: string[]
  tamanhos?: string[]
  ativo?: boolean
  status?: 'ativo' | 'inativo' | 'parcial'
  inactiveVariantCount?: number
  activeVariantCount?: number
  variacoes: CatalogVariant[]
}

export type CatalogStatusFilter = 'todos' | 'ativos' | 'inativos' | 'com_inativas'

export type CatalogQuery = {
  clienteCod?: string
  termo?: string
  page?: number
  pageSize?: number
  forceRefresh?: boolean
  statusFilter?: CatalogStatusFilter
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
  source: 'cache' | 'cache-stale' | 'supabase'
}
