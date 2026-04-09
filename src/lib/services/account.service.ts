import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { listCatalog } from '@/lib/services/catalog.service'
import { createSimpleId } from '@/lib/utils/id'
import { compactText } from '@/lib/utils/format'
import type { AccountCatalogScope, AccountDirectoryEntry, CreateAccountInput, UserAccount } from '@/types/account'
import type { CatalogProduct } from '@/types/catalog'
import type { ChangeRequest } from '@/types/request'

const ACCOUNT_STORE_PATH = path.join(process.cwd(), '.cache', 'accounts.json')

function nowIso() {
  return new Date().toISOString()
}

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

function buildSeedAccounts() {
  const createdAt = nowIso()

  return [
    {
      id: createSimpleId('conta'),
      email: 'admin@m3rcadeo.com',
      nome: 'Operacao M3rcadeo',
      role: 'admin',
      ativo: true,
      access: {
        scopeType: 'all',
        lojas: [],
        clienteCods: [],
        fornecedorPrefixes: [],
      },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createSimpleId('conta'),
      email: 'cliente.presente@m3rcadeo.com',
      nome: 'Cliente Presente Net',
      role: 'cliente',
      ativo: true,
      access: {
        scopeType: 'fornecedor_prefix',
        lojas: ['Presente Net'],
        clienteCods: [],
        fornecedorPrefixes: ['DANIK', 'PINK'],
      },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createSimpleId('conta'),
      email: 'cliente.krica@m3rcadeo.com',
      nome: 'Cliente KricaKids',
      role: 'cliente',
      ativo: true,
      access: {
        scopeType: 'cliente_cod',
        lojas: ['KricaKids'],
        clienteCods: ['KRICA'],
        fornecedorPrefixes: [],
      },
      createdAt,
      updatedAt: createdAt,
    },
  ] satisfies UserAccount[]
}

async function ensureAccountStore() {
  await mkdir(path.dirname(ACCOUNT_STORE_PATH), { recursive: true })

  try {
    const contents = await readFile(ACCOUNT_STORE_PATH, 'utf8')
    const parsed = JSON.parse(contents) as UserAccount[]

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    // fall through to seed store
  }

  const seeded = buildSeedAccounts()
  await writeFile(ACCOUNT_STORE_PATH, JSON.stringify(seeded, null, 2), 'utf8')
  return seeded
}

async function persistAccounts(accounts: UserAccount[]) {
  await mkdir(path.dirname(ACCOUNT_STORE_PATH), { recursive: true })
  await writeFile(ACCOUNT_STORE_PATH, JSON.stringify(accounts, null, 2), 'utf8')
}

function sortAccounts(accounts: UserAccount[]) {
  return [...accounts].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function listAccounts() {
  return sortAccounts(await ensureAccountStore())
}

export async function getAccountByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const accounts = await ensureAccountStore()
  return accounts.find((account) => normalizeEmail(account.email) === normalizedEmail) ?? null
}

export async function validateActiveAccount(email: string) {
  const account = await getAccountByEmail(email)

  if (!account || !account.ativo) {
    throw new Error('Conta invalida ou inativa')
  }

  return account
}

function buildAccess(input: CreateAccountInput): UserAccount['access'] {
  if (input.role === 'admin') {
    return {
      scopeType: 'all',
      lojas: [],
      clienteCods: [],
      fornecedorPrefixes: [],
    }
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

    return {
      scopeType: 'fornecedor_prefix',
      lojas: [loja],
      clienteCods: [],
      fornecedorPrefixes,
    }
  }

  const clienteCods = Array.from(new Set((input.clienteCods ?? []).map(normalizeCode).filter(Boolean)))

  if (clienteCods.length === 0) {
    throw new Error('Selecione pelo menos um cliente para esta conta.')
  }

  return {
    scopeType: 'cliente_cod',
    lojas: [loja],
    clienteCods,
    fornecedorPrefixes: [],
  }
}

export async function createAccount(input: CreateAccountInput) {
  const email = normalizeEmail(input.email)
  const nome = compactText(input.nome)

  if (!email || !nome) {
    throw new Error('Informe nome e e-mail para criar a conta.')
  }

  const existing = await getAccountByEmail(email)

  if (existing) {
    throw new Error('Ja existe uma conta cadastrada com este e-mail.')
  }

  const createdAt = nowIso()
  const account: UserAccount = {
    id: createSimpleId('conta'),
    email,
    nome,
    role: input.role,
    ativo: input.ativo ?? true,
    access: buildAccess(input),
    createdAt,
    updatedAt: createdAt,
  }

  const accounts = await ensureAccountStore()
  accounts.push(account)
  await persistAccounts(accounts)

  return account
}

export async function listAccountDirectory() {
  const products = await listCatalog()
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
