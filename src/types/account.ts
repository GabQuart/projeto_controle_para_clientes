export type AccountRole = 'admin' | 'cliente'

export type AccountScopeType = 'all' | 'cliente_cod' | 'fornecedor_prefix'

export type AccountAccess = {
  scopeType: AccountScopeType
  lojas: string[]
  clienteCods: string[]
  fornecedorPrefixes: string[]
}

export type UserAccount = {
  id: string
  email: string
  nome: string
  role: AccountRole
  ativo: boolean
  access: AccountAccess
  createdAt: string
  updatedAt: string
}

export type AccountDirectoryEntry = {
  loja: string
  clienteCod: string
  fornecedorPrefix: string
  label: string
}

export type AccountCatalogScope = {
  isAdmin: boolean
  lojas: string[]
  clienteCods: string[]
  fornecedorPrefixes: string[]
}

export type CreateAccountInput = {
  email: string
  nome: string
  role: AccountRole
  loja?: string
  clienteCods?: string[]
  fornecedorPrefixes?: string[]
  ativo?: boolean
}
