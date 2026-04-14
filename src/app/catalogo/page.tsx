'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionModal, type CompletedCatalogAction } from '@/components/ActionModal'
import { AlertModal } from '@/components/AlertModal'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { NewProductRequestModal } from '@/components/NewProductRequestModal'
import { PaginationControls } from '@/components/PaginationControls'
import { ProductTable } from '@/components/ProductTable'
import { useTranslations } from '@/components/providers/LocaleProvider'
import { SearchBar } from '@/components/SearchBar'
import type { UserAccount } from '@/types/account'
import type { CatalogPagination, CatalogProduct, CatalogStatusFilter, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'

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
  quantity?: number
}

function getEligibleVariants(item: { product: CatalogProduct; variant?: CatalogVariant }, requestedAction: RequestedCatalogAction) {
  const variants = item.variant ? [item.variant] : item.product.variacoes

  if (requestedAction === 'ativar') {
    return variants.filter((variant) => !variant.ativo)
  }

  return variants.filter((variant) => Boolean(variant.ativo))
}

function getBlockedActionMessage(item: { product: CatalogProduct; variant?: CatalogVariant }, requestedAction: RequestedCatalogAction) {
  const isVariantAction = Boolean(item.variant)

  if (requestedAction === 'ativar') {
    return isVariantAction ? 'A variacao selecionada ja esta ativa.' : 'Nao existem variacoes inativas para ativar neste produto.'
  }

  return isVariantAction ? 'A variacao selecionada ja esta inativa.' : 'Nao existem variacoes ativas para inativar neste produto.'
}

function deriveProductStatus(product: CatalogProduct): CatalogProduct {
  const totalVariants = product.variacoes.length

  if (totalVariants === 0) {
    return {
      ...product,
      ativo: product.ativo,
      status: product.ativo ? 'ativo' : 'inativo',
      activeVariantCount: product.ativo ? 1 : 0,
      inactiveVariantCount: product.ativo ? 0 : 1,
    }
  }

  const activeVariantCount = product.variacoes.filter((variant) => Boolean(variant.ativo)).length
  const inactiveVariantCount = totalVariants - activeVariantCount
  const status: CatalogProduct['status'] =
    activeVariantCount === 0 ? 'inativo' : inactiveVariantCount === 0 ? 'ativo' : 'parcial'

  return {
    ...product,
    ativo: status !== 'inativo',
    status,
    activeVariantCount,
    inactiveVariantCount,
  }
}

export default function CatalogoPage() {
  const t = useTranslations()
  const router = useRouter()
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<CatalogPagination>(EMPTY_PAGINATION)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<SelectedCatalogAction | null>(null)
  const [fornecedorFilter, setFornecedorFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState<CatalogStatusFilter>('todos')
  const [queuedCount, setQueuedCount] = useState(0)
  const [alertMessage, setAlertMessage] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [newProductRequestOpen, setNewProductRequestOpen] = useState(false)
  const [actionRefreshing, setActionRefreshing] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const forceRefreshRef = useRef(false)

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
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

  const loadCatalog = useCallback(
    async (input: { signal?: AbortSignal; forceRefresh?: boolean } = {}) => {
      if (!account) {
        return
      }

      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        params.set('page', String(currentPage))
        params.set('pageSize', String(PAGE_SIZE))
        params.set('status', statusFilter)

        if (search.trim()) {
          params.set('termo', search.trim())
        }

        if (fornecedorFilter !== 'todos') {
          params.set('fornecedor', fornecedorFilter)
        }

        if (input.forceRefresh) {
          params.set('refresh', 'true')
        }

        const response = await fetch(`/api/catalogo?${params.toString()}`, {
          signal: input.signal,
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/login')
            return
          }

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
        setActionRefreshing(false)
        forceRefreshRef.current = false
      }
    },
    [account, currentPage, fornecedorFilter, router, search, statusFilter],
  )

  useEffect(() => {
    if (!account) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      loadCatalog({ signal: controller.signal, forceRefresh: forceRefreshRef.current })
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [account, loadCatalog, refreshNonce])

  const summary = useMemo(() => {
    const variants = products.reduce((total, product) => total + product.variacoes.length, 0)
    const inactiveVariants = products.reduce((total, product) => total + (product.inactiveVariantCount ?? 0), 0)
    return { products: products.length, variants, inactiveVariants, totalProducts: pagination.total }
  }, [pagination.total, products])

  const accountScopeLabel = useMemo(() => {
    if (!account) {
      return t('catalog.accountScope.loading')
    }

    if (account.role === 'admin') {
      return t('catalog.accountScope.allStores')
    }

    return account.access.lojas[0] || account.access.clienteCods[0] || t('catalog.accountScope.myStore')
  }, [account, t])

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

    if (eligibleVariants.length === 0) {
      const isVariantAction = Boolean(input.variant)
      const message =
        input.requestedAction === 'ativar'
          ? isVariantAction
            ? t('catalog.alerts.selectedVariantAlreadyActive')
            : t('catalog.alerts.noInactiveToActivate')
          : isVariantAction
            ? t('catalog.alerts.selectedVariantAlreadyInactive')
            : t('catalog.alerts.noActiveToDeactivate')
      setError(message)
      setAlertMessage(message)
      return
    }

    if (input.requestedAction === 'ativar' && (!input.quantity || input.quantity <= 0)) {
      const message = t('catalog.alerts.fillQuantity')
      setError(message)
      setAlertMessage(message)
      return
    }

    setError('')
    setSelectedItem(input)
  }

  function handleActionCreated(result: CompletedCatalogAction) {
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.skuBase !== result.skuBase) {
          return product
        }

        return deriveProductStatus({
          ...product,
          variacoes: product.variacoes.map((variant) =>
            result.updatedVariantSkus.includes(variant.sku)
              ? {
                  ...variant,
                  ativo: result.nextActive,
                  status: result.nextActive ? 'ativo' : 'inativo',
                }
              : variant,
          ),
        })
      }),
    )
    setQueuedCount((current) => current + 1)
    setSelectedItem(null)
    forceRefreshRef.current = true
    setActionRefreshing(true)
    setRefreshNonce((current) => current + 1)
  }

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.replace('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[32px] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">{t('catalog.panelLabel')}</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">
              {t('catalog.title', { scope: accountScopeLabel })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-steel sm:text-base">
              {account?.nome ?? 'Carregando...'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
              <span className="brand-chip rounded-full px-3 py-1">{account?.role === 'admin' ? t('catalog.adminRole') : t('catalog.clientRole')}</span>
              <span className="brand-chip rounded-full px-3 py-1">{t('catalog.queue', { count: queuedCount })}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setNewProductRequestOpen(true)}
              className="rounded-full bg-amber px-4 py-3 text-center text-sm font-semibold text-night transition hover:bg-[#ffd77a]"
            >
              {t('catalog.addProduct')}
            </button>
            <Link
              href="/historico"
              className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
            >
              {t('catalog.viewHistory')}
            </Link>
            {account?.role === 'admin' ? (
              <Link
                href="/contas"
                className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
              >
                {t('catalog.manageAccounts')}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-cobalt px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#418dff]"
            >
              {t('catalog.logout')}
            </button>
          </div>
        </div>

        <div className={`mt-8 grid gap-4 ${fornecedorOptions.length > 0 ? 'xl:grid-cols-[2fr_1fr_1fr_1fr]' : 'xl:grid-cols-[2fr_1fr_1fr]'}`}>
          <SearchBar value={search} onChange={handleSearchChange} placeholder={t('catalog.searchPlaceholder')} label={t('history.searchLabel')} />
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            {t('catalog.status')}
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as CatalogStatusFilter)
                setCurrentPage(1)
              }}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
            >
              <option value="todos" className="bg-slate text-ink">{t('catalog.statusOptions.all')}</option>
              <option value="ativos" className="bg-slate text-ink">{t('catalog.statusOptions.active')}</option>
              <option value="inativos" className="bg-slate text-ink">{t('catalog.statusOptions.inactive')}</option>
              <option value="com_inativas" className="bg-slate text-ink">{t('catalog.statusOptions.withInactive')}</option>
            </select>
          </label>
          {fornecedorOptions.length > 0 ? (
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
              {t('catalog.supplier')}
              <select
                value={fornecedorFilter}
                onChange={(event) => {
                  setFornecedorFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              >
                <option value="todos" className="bg-slate text-ink">{t('catalog.allSuppliers')}</option>
                {fornecedorOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate text-ink">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="brand-chip rounded-3xl p-4 text-sm text-steel">
            <p className="font-semibold uppercase tracking-[0.16em] text-ink">{t('catalog.summary')}</p>
            <p className="mt-2">
              {t('catalog.summaryProducts', { current: summary.products, total: summary.totalProducts })}
            </p>
            <p>{t('catalog.summaryVariants', { count: summary.variants })}</p>
            <p>{t('catalog.summaryInactiveVariants', { count: summary.inactiveVariants })}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {error ? <div className="mb-4 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}
        {loading ? (
          <div className="panel rounded-3xl p-6 text-sm text-steel">{t('catalog.loading')}</div>
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
        onCreated={handleActionCreated}
      />
      <NewProductRequestModal
        open={newProductRequestOpen}
        account={account}
        onClose={() => setNewProductRequestOpen(false)}
        onCreated={() => setQueuedCount((current) => current + 1)}
        onSuccessMessage={(message) => setAlertMessage(message)}
      />
      <AlertModal open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
      <LoadingOverlay
        open={loading || loggingOut || actionRefreshing}
        label={loggingOut ? t('catalog.loggingOut') : actionRefreshing ? t('catalog.updatingProduct') : t('catalog.loadingData')}
      />
    </main>
  )
}
