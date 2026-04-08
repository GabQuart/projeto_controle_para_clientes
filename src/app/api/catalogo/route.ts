import { NextResponse } from 'next/server'
import { listCatalog } from '@/lib/services/catalog.service'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteCod = searchParams.get('clienteCod') ?? undefined
    const termo = searchParams.get('termo') ?? undefined
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)

    const data = await listCatalog({ clienteCod, termo })
    const total = data.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedData = data.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page: currentPage,
        pageSize,
        total,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar catalogo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
