import { listCatalog } from '@/lib/services/catalog.service'
import { compactText } from '@/lib/utils/format'
import { createClient } from '@/utils/supabase/server'
import type {
  AccountAccessScopeRow,
  AccountCatalogScope,
  AccountDirectoryEntry,
  AccountRecordRow,
  CreateAccountInput,
  UserAccount,
} from '@/types/account'
import type { CatalogProduct } from '@/types/catalog'
import type { ChangeRequest } from '@/types/request'

const ACCOUNTS_TABLE = 'app_accounts'
const ACCOUNT_SCOPES_TABLE = 'account_access_scopes'
const ACCOUNT_DIRECTORY_TABLE = 'catalog_directory_entries'

function normalizeEmail(email: string) {
  return compactText(email).toLowerCase()
}

function normalizeCode(code: string) {
  return compactText(code).toUpperCase()
}

function normalizePrefix(prefix: string) {
  return normalizeCode(prefix).slice(0, 5)
}

function getFornecedorPrefix(product: Pick<CatalogProduct, 'clienteCod' | 'skuBase'> | Pick<ChangeRequest, 'clienteCod' | 'skuBase'>) {
  return normalizePrefix(product.clienteCod || product.skuBase)
}

function unique(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.map((value) => compactText(value ?? '')).filter(Boolean)))
}

function mapAccountRow(row: AccountRecordRow): UserAccount {
  const scopes = row.account_access_scopes ?? []

  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    role: row.role,
    ativo: row.ativo,
    access: {
      scopeType: row.scope_type,
      lojas: unique(scopes.map((scope) => scope.loja)),
      clienteCods: unique(scopes.map((scope) => scope.cliente_cod)).map(normalizeCode),
      fornecedorPrefixes: unique(scopes.map((scope) => scope.fornecedor_prefix)).map(normalizePrefix),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function buildAccessRows(accountId: string, input: CreateAccountInput) {
  if (input.role === 'admin') {
    return [] satisfies AccountAccessScopeRow[]
  }

  const loja = compactText(input.loja)

  if (!loja) {
    throw new Error('Selecione a loja vinculada a esta conta de cliente.')
  }

  if (loja === 'Presente Net') {
    const fornecedorPrefixes = Array.from(
      new Set((input.fornecedorPrefixes ?? []).map(normalizePrefix).filter(Boolean)),
    )

    if (fornecedorPrefixes.length === 0) {
      throw new Error('Selecione pelo menos um fornecedor da Presente Net.')
    }

    return fornecedorPrefixes.map((fornecedorPrefix) => ({
      account_id: accountId,
      loja,
      cliente_cod: null,
      fornecedor_prefix: fornecedorPrefix,
    }))
  }

  const clienteCods = Array.from(new Set((input.clienteCods ?? []).map(normalizeCode).filter(Boolean)))

  if (clienteCods.length === 0) {
    throw new Error('Selecione pelo menos um cliente para esta conta.')
  }

  return clienteCods.map((clienteCod) => ({
    account_id: accountId,
    loja,
    cliente_cod: clienteCod,
    fornecedor_prefix: null,
  }))
}

async function fetchAccountRows(options: { email?: string } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from(ACCOUNTS_TABLE)
    .select('id,email,nome,role,ativo,scope_type,created_at,updated_at,account_access_scopes(id,loja,cliente_cod,fornecedor_prefix)')
    .order('nome', { ascending: true })

  if (options.email) {
    query = query.eq('email', normalizeEmail(options.email))
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Falha ao carregar contas do Supabase: ${error.message}`)
  }

  return (data ?? []) as AccountRecordRow[]
}

async function getAuthenticatedUserEmail() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(`Falha ao validar a sessao do Supabase: ${error.message}`)
  }

  return normalizeEmail(user?.email ?? '')
}

export async function getAuthenticatedAccount() {
  const email = await getAuthenticatedUserEmail()

  if (!email) {
    return null
  }

  return getAccountByEmail(email)
}

export async function requireAdminAccount() {
  const account = await getAuthenticatedAccount()

  if (!account) {
    throw new Error('Sessao autenticada nao encontrada.')
  }

  if (!account.ativo || account.role !== 'admin') {
    throw new Error('Apenas administradores podem realizar esta operacao.')
  }

  return account
}

export async function listAccounts() {
  await requireAdminAccount()
  const rows = await fetchAccountRows()
  return rows.map(mapAccountRow)
}

export async function getAccountByEmail(email: string) {
  if (!email) {
    return null
  }

  const rows = await fetchAccountRows({ email })
  return rows[0] ? mapAccountRow(rows[0]) : null
}

export async function validateActiveAccount(email: string) {
  const account = await getAccountByEmail(email)

  if (!account || !account.ativo) {
    throw new Error('Conta invalida ou inativa')
  }

  return account
}

function buildDirectoryEntries(products: CatalogProduct[]) {
  const seen = new Set<string>()

  return products
    .map<AccountDirectoryEntry>((product) => ({
      loja: product.loja,
      clienteCod: normalizeCode(product.clienteCod),
      fornecedorPrefix: getFornecedorPrefix(product),
      label:
        product.loja === 'Presente Net'
          ? `${getFornecedorPrefix(product)} | ${product.titulo}`
          : `${product.loja} | ${normalizeCode(product.clienteCod)}`,
    }))
    .filter((entry) => {
      const key = `${entry.loja}:${entry.clienteCod}:${entry.fornecedorPrefix}`

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .sort((a, b) => {
      if (a.loja !== b.loja) {
        return a.loja.localeCompare(b.loja, 'pt-BR')
      }

      return a.fornecedorPrefix.localeCompare(b.fornecedorPrefix, 'pt-BR')
    })
}

async function readDirectoryEntries() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(ACCOUNT_DIRECTORY_TABLE)
    .select('id,loja,cliente_cod,fornecedor_prefix,label,created_at,updated_at')
    .order('loja', { ascending: true })
    .order('fornecedor_prefix', { ascending: true })

  if (error) {
    throw new Error(`Falha ao carregar o diretorio de contas: ${error.message}`)
  }

  return (data ?? []).map<AccountDirectoryEntry>((entry) => ({
    id: entry.id,
    loja: entry.loja,
    clienteCod: entry.cliente_cod,
    fornecedorPrefix: entry.fornecedor_prefix,
    label: entry.label,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }))
}

export async function syncAccountDirectory(forceRefresh = false) {
  await requireAdminAccount()
  const currentEntries = forceRefresh ? [] : await readDirectoryEntries()

  if (!forceRefresh && currentEntries.length > 0) {
    return currentEntries
  }

  const products = await listCatalog({ forceRefresh: true })
  const entries = buildDirectoryEntries(products)
  const supabase = await createClient()

  const { error } = await supabase.from(ACCOUNT_DIRECTORY_TABLE).upsert(
    entries.map((entry) => ({
      loja: entry.loja,
      cliente_cod: entry.clienteCod,
      fornecedor_prefix: entry.fornecedorPrefix,
      label: entry.label,
    })),
    {
      onConflict: 'loja,cliente_cod,fornecedor_prefix',
      ignoreDuplicates: false,
    },
  )

  if (error) {
    throw new Error(`Falha ao sincronizar diretorio de contas: ${error.message}`)
  }

  return readDirectoryEntries()
}

export async function listAccountDirectory(options: { refresh?: boolean } = {}) {
  return syncAccountDirectory(options.refresh ?? false)
}

export async function createAccount(input: CreateAccountInput) {
  await requireAdminAccount()

  const email = normalizeEmail(input.email)
  const nome = compactText(input.nome)

  if (!email || !nome) {
    throw new Error('Informe nome e e-mail para criar a conta.')
  }

  const supabase = await createClient()
  const existing = await getAccountByEmail(email)

  if (existing) {
    throw new Error('Ja existe uma conta cadastrada com este e-mail.')
  }

  const { data, error } = await supabase
    .from(ACCOUNTS_TABLE)
    .insert({
      email,
      nome,
      role: input.role,
      ativo: input.ativo ?? true,
      scope_type: input.role === 'admin' ? 'all' : compactText(input.loja) === 'Presente Net' ? 'fornecedor_prefix' : 'cliente_cod',
    })
    .select('id,email,nome,role,ativo,scope_type,created_at,updated_at')
    .single()

  if (error || !data) {
    throw new Error(`Falha ao criar a conta no Supabase: ${error?.message ?? 'registro nao retornado'}`)
  }

  const accessRows = buildAccessRows(data.id, input)

  if (accessRows.length > 0) {
    const { error: scopeError } = await supabase.from(ACCOUNT_SCOPES_TABLE).insert(accessRows)

    if (scopeError) {
      throw new Error(`Falha ao criar os relacionamentos de acesso: ${scopeError.message}`)
    }
  }

  return validateActiveAccount(email)
}

export function buildAccountCatalogScope(account: UserAccount): AccountCatalogScope {
  return {
    isAdmin: account.role === 'admin',
    lojas: account.access.lojas,
    clienteCods: account.access.clienteCods,
    fornecedorPrefixes: account.access.fornecedorPrefixes,
  }
}

export function canAccessCatalogProduct(account: UserAccount, product: CatalogProduct) {
  if (account.role === 'admin') {
    return true
  }

  if (account.access.scopeType === 'fornecedor_prefix') {
    return account.access.lojas.includes(product.loja) && account.access.fornecedorPrefixes.includes(getFornecedorPrefix(product))
  }

  return account.access.lojas.includes(product.loja) && account.access.clienteCods.includes(normalizeCode(product.clienteCod))
}

export function filterCatalogProductsForAccount(account: UserAccount, products: CatalogProduct[]) {
  return products.filter((product) => canAccessCatalogProduct(account, product))
}

export function canAccessRequest(account: UserAccount, request: ChangeRequest) {
  if (account.role === 'admin') {
    return true
  }

  if (account.access.scopeType === 'fornecedor_prefix') {
    return account.access.lojas.includes(request.loja) && account.access.fornecedorPrefixes.includes(getFornecedorPrefix(request))
  }

  return account.access.lojas.includes(request.loja) && account.access.clienteCods.includes(normalizeCode(request.clienteCod))
}

export function filterRequestsForAccount(account: UserAccount, requests: ChangeRequest[]) {
  return requests.filter((request) => canAccessRequest(account, request))
}
