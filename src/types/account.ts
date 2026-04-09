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
  id?: string
  loja: string
  clienteCod: string
  fornecedorPrefix: string
  label: string
  createdAt?: string
  updatedAt?: string
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

export type AccountAccessScopeRow = {
  id?: string
  loja: string
  cliente_cod: string | null
  fornecedor_prefix: string | null
}

export type AccountRecordRow = {
  id: string
  email: string
  nome: string
  role: AccountRole
  ativo: boolean
  scope_type: AccountScopeType
  created_at: string
  updated_at: string
  account_access_scopes?: AccountAccessScopeRow[] | null
}
