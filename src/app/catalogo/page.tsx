'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ActionModal } from '@/components/ActionModal'
import { PaginationControls } from '@/components/PaginationControls'
import { ProductTable } from '@/components/ProductTable'
import { SearchBar } from '@/components/SearchBar'
import type { CatalogPagination, CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { Operator } from '@/types/operator'

const STORAGE_KEY = 'catalogo-marketplace.operator'
const PAGE_SIZE = 10

const EMPTY_PAGINATION: CatalogPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

export default function CatalogoPage() {
  const router = useRouter()
  const [operator, setOperator] = useState<Operator | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<CatalogPagination>(EMPTY_PAGINATION)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<{ product: CatalogProduct; variant?: CatalogVariant } | null>(null)

  useEffect(() => {
    const storedOperator = sessionStorage.getItem(STORAGE_KEY)

    if (!storedOperator) {
      router.replace('/login')
      return
    }

    try {
      setOperator(JSON.parse(storedOperator) as Operator)
    } catch {
      router.replace('/login')
    }
  }, [router])

  useEffect(() => {
    if (!operator) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        params.set('clienteCod', operator.clienteCod)
        params.set('page', String(currentPage))
        params.set('pageSize', String(PAGE_SIZE))
        if (search.trim()) {
          params.set('termo', search.trim())
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
  }, [currentPage, operator, search])

  const summary = useMemo(() => {
    const variants = products.reduce((total, product) => total + product.variacoes.length, 0)
    return { products: products.length, variants, totalProducts: pagination.total }
  }, [pagination.total, products])

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

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY)
    router.push('/login')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber">Catalogo operacional</p>
            <h1 className="mt-3 text-2xl font-black text-ink sm:text-3xl lg:text-4xl">Produtos e variacoes para acao rapida</h1>
            <p className="mt-3 max-w-2xl text-sm text-ink/75 sm:text-base">
              Operador atual: <span className="font-bold">{operator?.nome ?? 'Carregando...'}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
              <span className="rounded-full bg-ink/5 px-3 py-1">Loja: {operator?.loja ?? '-'}</span>
              <span className="rounded-full bg-ink/5 px-3 py-1">Cliente: {operator?.clienteCod ?? '-'}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/historico" className="rounded-full border border-black/10 px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber hover:text-amber">
              Ver historico
            </Link>
            <button type="button" onClick={handleLogout} className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90">
              Trocar operador
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <SearchBar value={search} onChange={handleSearchChange} />
          <div className="rounded-3xl bg-mist p-4 text-sm text-ink/80">
            <p className="font-semibold">Resumo atual</p>
            <p className="mt-2">
              Exibindo {summary.products} de {summary.totalProducts} produtos
            </p>
            <p>{summary.variants} variacoes nesta pagina</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {error ? <div className="mb-4 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}
        {loading ? (
          <div className="panel rounded-3xl p-6 text-sm text-steel">Carregando catalogo a partir do Google Sheets...</div>
        ) : (
          <ProductTable
            products={products}
            expandedIds={expandedIds}
            onToggle={toggleExpanded}
            onAction={setSelectedItem}
          />
        )}

        {!loading ? <div className="mt-4"><PaginationControls pagination={pagination} onPageChange={handlePageChange} /></div> : null}
      </section>

      <ActionModal
        open={Boolean(selectedItem)}
        operator={operator}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onCreated={() => router.refresh()}
      />
    </main>
  )
}
