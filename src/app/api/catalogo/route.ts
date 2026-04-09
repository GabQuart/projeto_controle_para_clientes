import { NextResponse } from 'next/server'
import { filterCatalogProductsForAccount, getAuthenticatedAccount } from '@/lib/services/account.service'
import { enrichCatalogProductImages, getCatalogCacheMetadata, listCatalog } from '@/lib/services/catalog.service'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function parseBoolean(value: string | null) {
  return value === '1' || value === 'true'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteCod = searchParams.get('clienteCod') ?? undefined
    const loja = searchParams.get('loja') ?? undefined
    const fornecedor = searchParams.get('fornecedor') ?? undefined
    const termo = searchParams.get('termo') ?? undefined
    const forceRefresh = parseBoolean(searchParams.get('refresh'))
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)

    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const [data, cache] = await Promise.all([
      listCatalog({ termo, forceRefresh }),
      getCatalogCacheMetadata({ forceRefresh }),
    ])
    const scopedData = account ? filterCatalogProductsForAccount(account, data) : data
    const normalizedFornecedor = (fornecedor ?? '').trim().toUpperCase()
    const filteredData = scopedData.filter((product) => {
      if (clienteCod && product.clienteCod !== clienteCod) {
        return false
      }

      if (loja && product.loja !== loja) {
        return false
      }

      if (normalizedFornecedor && product.clienteCod.slice(0, 5).toUpperCase() !== normalizedFornecedor) {
        return false
      }

      return true
    })
    const total = filteredData.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)
    const enrichedData = await enrichCatalogProductImages(paginatedData)

    return NextResponse.json(
      {
        data: enrichedData,
        pagination: {
          page: currentPage,
          pageSize,
          total,
          totalPages,
          hasPreviousPage: currentPage > 1,
          hasNextPage: currentPage < totalPages,
        },
        cache,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar catalogo'
    return NextResponse.json({ error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
