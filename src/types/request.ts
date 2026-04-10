export type ChangeRequestStatus = 'nao_concluido' | 'em_andamento' | 'concluido' | 'cancelado'

export type ChangeRequestType =
  | 'ativar_produto'
  | 'inativar_produto'
  | 'ativar_variacao'
  | 'inativar_variacao'
  | 'alteracao_especifica'

export type RequestedCatalogAction = 'ativar' | 'inativar'

export type RequestedVariantStock = {
  sku: string
  cor?: string
  tamanho?: string
  estoque: number
}

export type ChangeRequest = {
  id: string
  loteId?: string
  dataAbertura: string
  operadorEmail: string
  operadorNome: string
  clienteCod: string
  loja: string
  skuBase: string
  skuVariacao?: string
  titulo: string
  fotoRef?: string
  tipoAlteracao: ChangeRequestType
  detalhe: string
  status: ChangeRequestStatus
  responsavelInterno?: string
  dataConclusao?: string
  variacoesSelecionadas?: string[]
  estoqueGeral?: number
  estoquePorVariacao?: RequestedVariantStock[]
}

export type BulkRequestItemInput = {
  skuBase: string
}

export type BulkCreateRequestInput = {
  operadorEmail: string
  tipoAlteracao: ChangeRequestType
  detalhe: string
  estoqueGeral?: number
  items: BulkRequestItemInput[]
}

export type ChangeRequestFilters = {
  status?: ChangeRequestStatus
  sku?: string
  nome?: string
  loja?: string
}
