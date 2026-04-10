import { compactText } from '@/lib/utils/format'
import { createAdminClient } from '@/utils/supabase/admin'
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
const CLIENTS_TABLE = 'clientes'
const STORES_TABLE = 'lojas'

type ClientDirectoryRow = {
  fornecedor_cod?: string | null
  num_forn?: number | null
  loja_id?: number | null
}

type StoreDirectoryRow = {
  id: number
  nome?: string | null
}

function normalizeEmail(email: string) {
  return compactText(email).toLowerCase()
}

function normalizeCode(code?: string | null) {
  return compactText(code ?? '').toUpperCase()
}

function normalizePrefix(prefix?: string | null) {
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

export async function getPublicAccountStatusByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('account_status_by_email', {
    target_email: normalizedEmail,
  })

  if (error) {
    throw new Error(`Falha ao verificar conta cadastrada: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : null

  if (!row) {
    return null
  }

  return {
    email: row.email as string,
    nome: row.nome as string,
    role: row.role as UserAccount['role'],
    ativo: Boolean(row.ativo),
  }
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

async function readDirectoryEntries() {
  const supabase = createAdminClient()
  const [{ data: clientRows, error: clientError }, { data: storeRows, error: storeError }] = await Promise.all([
    supabase.from(CLIENTS_TABLE).select('fornecedor_cod,num_forn,loja_id').order('fornecedor_cod', { ascending: true }),
    supabase.from(STORES_TABLE).select('id,nome').order('nome', { ascending: true }),
  ])

  if (clientError) {
    throw new Error(`Falha ao carregar clientes do diretorio: ${clientError.message}`)
  }

  if (storeError) {
    throw new Error(`Falha ao carregar lojas do diretorio: ${storeError.message}`)
  }

  const storesById = new Map<number, string>(
    ((storeRows ?? []) as StoreDirectoryRow[]).map((store) => [store.id, compactText(store.nome ?? '')]),
  )

  return ((clientRows ?? []) as ClientDirectoryRow[])
    .map<AccountDirectoryEntry>((client) => {
      const fornecedorPrefix = normalizePrefix(client.fornecedor_cod)
      const loja = storesById.get(Number(client.loja_id)) || 'Sem loja'
      const clienteCod = fornecedorPrefix
      const numeroFornecedor = client.num_forn ? String(client.num_forn) : fornecedorPrefix

      return {
        loja,
        clienteCod,
        fornecedorPrefix,
        label: loja === 'Presente Net' ? `${fornecedorPrefix} | Fornecedor ${numeroFornecedor}` : `${loja} | ${clienteCod}`,
      }
    })
    .filter((entry) => entry.fornecedorPrefix)
    .filter((entry, index, entries) =>
      entries.findIndex(
        (candidate) =>
          candidate.loja === entry.loja &&
          candidate.clienteCod === entry.clienteCod &&
          candidate.fornecedorPrefix === entry.fornecedorPrefix,
      ) === index,
    )
    .sort((a, b) => {
      if (a.loja !== b.loja) {
        return a.loja.localeCompare(b.loja, 'pt-BR')
      }

      return a.fornecedorPrefix.localeCompare(b.fornecedorPrefix, 'pt-BR')
    })
}

export async function syncAccountDirectory(_forceRefresh = false) {
  await requireAdminAccount()
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

  let provisionedAuthUserId = ''
  let createdAccountId = ''

  if (input.provisionAuthUser) {
    const temporaryPassword = compactText(input.temporaryPassword)

    if (temporaryPassword.length < 6) {
      throw new Error('Informe uma senha temporaria com pelo menos 6 caracteres para criar o login.')
    }

    const adminSupabase = createAdminClient()
    const { data: authUserData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: input.confirmEmail ?? true,
      user_metadata: {
        nome,
        role: input.role,
      },
    })

    if (authError) {
      if (compactText(authError.message).toLowerCase().includes('already been registered')) {
        throw new Error('Esse e-mail ja possui login no Supabase Auth. Use outro e-mail ou desative a criacao automatica do login.')
      }

      throw new Error(`Falha ao criar o login no Supabase Auth: ${authError.message}`)
    }

    provisionedAuthUserId = authUserData.user.id
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
    if (provisionedAuthUserId) {
      const adminSupabase = createAdminClient()
      await adminSupabase.auth.admin.deleteUser(provisionedAuthUserId)
    }

    throw new Error(`Falha ao criar a conta no Supabase: ${error?.message ?? 'registro nao retornado'}`)
  }

  createdAccountId = data.id
  const accessRows = buildAccessRows(data.id, input)

  if (accessRows.length > 0) {
    const { error: scopeError } = await supabase.from(ACCOUNT_SCOPES_TABLE).insert(accessRows)

    if (scopeError) {
      if (createdAccountId) {
        await supabase.from(ACCOUNTS_TABLE).delete().eq('id', createdAccountId)
      }

      if (provisionedAuthUserId) {
        const adminSupabase = createAdminClient()
        await adminSupabase.auth.admin.deleteUser(provisionedAuthUserId)
      }

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
