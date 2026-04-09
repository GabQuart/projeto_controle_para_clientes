'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ActionModal } from '@/components/ActionModal'
import { PaginationControls } from '@/components/PaginationControls'
import { ProductTable } from '@/components/ProductTable'
import { SearchBar } from '@/components/SearchBar'
import type { UserAccount } from '@/types/account'
import type { CatalogPagination, CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'

const PAGE_SIZE = 10

const EMPTY_PAGINATION: CatalogPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

type SelectedCatalogAction = {
  product: CatalogProduct
  variant?: CatalogVariant
  requestedAction: RequestedCatalogAction
}

function getEligibleVariants(item: { product: CatalogProduct; variant?: CatalogVariant }, requestedAction: RequestedCatalogAction) {
  const variants = item.variant ? [item.variant] : item.product.variacoes

  if (requestedAction === 'ativar') {
    return variants.filter((variant) => !variant.ativo)
  }

  if (requestedAction === 'inativar') {
    return variants.filter((variant) => Boolean(variant.ativo))
  }

  return variants
}

function getBlockedActionMessage(item: { product: CatalogProduct; variant?: CatalogVariant }, requestedAction: RequestedCatalogAction) {
  const isVariantAction = Boolean(item.variant)

  if (requestedAction === 'ativar') {
    return isVariantAction ? 'A variacao selecionada ja esta ativa.' : 'Nao existem variacoes inativas para ativar neste produto.'
  }

  if (requestedAction === 'inativar') {
    return isVariantAction ? 'A variacao selecionada ja esta inativa.' : 'Nao existem variacoes ativas para inativar neste produto.'
  }

  return item.product.variacoes.length === 0 ? 'Este produto nao possui variacoes cadastradas para selecionar.' : ''
}

export default function CatalogoPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<CatalogPagination>(EMPTY_PAGINATION)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [selectedItem, setSelectedItem] = useState<SelectedCatalogAction | null>(null)
  const [fornecedorFilter, setFornecedorFilter] = useState('todos')

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar sessao autenticada')
        }

        if (!payload.account) {
          router.replace('/login')
          return
        }

        setAccount(payload.account)
      } catch {
        router.replace('/login')
      }
    }

    loadSession()
  }, [router])

  useEffect(() => {
    if (!account) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        params.set('email', account.email)
        params.set('page', String(currentPage))
        params.set('pageSize', String(PAGE_SIZE))

        if (search.trim()) {
          params.set('termo', search.trim())
        }

        if (fornecedorFilter !== 'todos') {
          params.set('fornecedor', fornecedorFilter)
        }

        const response = await fetch(`/api/catalogo?${params.toString()}`, { signal: controller.signal })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar catalogo')
        }

        setProducts(payload.data)
        setPagination(payload.pagination ?? EMPTY_PAGINATION)

        if (payload.pagination?.page && payload.pagination.page !== currentPage) {
          setCurrentPage(payload.pagination.page)
        }
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar catalogo')
          setProducts([])
          setPagination(EMPTY_PAGINATION)
        }
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [account, currentPage, fornecedorFilter, refreshNonce, search])

  const summary = useMemo(() => {
    const variants = products.reduce((total, product) => total + product.variacoes.length, 0)
    return { products: products.length, variants, totalProducts: pagination.total }
  }, [pagination.total, products])

  const fornecedorOptions = useMemo(() => {
    if (!account || account.access.scopeType !== 'fornecedor_prefix') {
      return []
    }

    return account.access.fornecedorPrefixes
  }, [account])

  function toggleExpanded(skuBase: string) {
    setExpandedIds((current) => (current.includes(skuBase) ? current.filter((item) => item !== skuBase) : [...current, skuBase]))
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
    setExpandedIds([])
  }

  function handlePageChange(page: number) {
    if (page === currentPage || page < 1 || page > pagination.totalPages) {
      return
    }

    setCurrentPage(page)
    setExpandedIds([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleOpenAction(input: SelectedCatalogAction) {
    const eligibleVariants = getEligibleVariants(input, input.requestedAction)

    if (input.requestedAction !== 'alteracao_especifica' && eligibleVariants.length === 0) {
      const message = getBlockedActionMessage(input, input.requestedAction)
      setError(message)
      window.alert(message)
      return
    }

    setError('')
    setSelectedItem(input)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[32px] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Painel operacional</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">
              Catalogo autenticado por conta com acesso recortado pela operacao
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-steel sm:text-base">
              Sessao atual: <span className="font-semibold text-ink">{account?.nome ?? 'Carregando...'}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
              <span className="brand-chip rounded-full px-3 py-1">Perfil: {account?.role ?? '-'}</span>
              <span className="brand-chip rounded-full px-3 py-1">
                Escopo: {account?.role === 'admin' ? 'Todos os produtos' : account?.access.lojas.join(', ') || '-'}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/historico"
              className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
            >
              Ver historico
            </Link>
            <Link
              href="/contas"
              className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
            >
              Gerenciar contas
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-cobalt px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#418dff]"
            >
              Sair
            </button>
          </div>
        </div>

        <div className={`mt-8 grid gap-4 ${fornecedorOptions.length > 0 ? 'lg:grid-cols-[2fr_1fr_1fr]' : 'lg:grid-cols-[2fr_1fr]'}`}>
          <SearchBar value={search} onChange={handleSearchChange} />
          {fornecedorOptions.length > 0 ? (
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
              Fornecedor
              <select
                value={fornecedorFilter}
                onChange={(event) => {
                  setFornecedorFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              >
                <option value="todos" className="bg-slate text-ink">Todos os fornecedores</option>
                {fornecedorOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate text-ink">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="brand-chip rounded-3xl p-4 text-sm text-steel">
            <p className="font-semibold uppercase tracking-[0.16em] text-ink">Resumo atual</p>
            <p className="mt-2">
              Exibindo <span className="text-ink">{summary.products}</span> de <span className="text-ink">{summary.totalProducts}</span> produtos
            </p>
            <p>{summary.variants} variacoes nesta pagina</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {error ? <div className="mb-4 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}
        {loading ? (
          <div className="panel rounded-3xl p-6 text-sm text-steel">Carregando catalogo autenticado...</div>
        ) : (
          <ProductTable products={products} expandedIds={expandedIds} onToggle={toggleExpanded} onAction={handleOpenAction} />
        )}

        {!loading ? (
          <div className="mt-4">
            <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
          </div>
        ) : null}
      </section>

      <ActionModal
        open={Boolean(selectedItem)}
        operator={account}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onCreated={() => {
          setSelectedItem(null)
          setRefreshNonce((current) => current + 1)
        }}
      />
    </main>
  )
}
