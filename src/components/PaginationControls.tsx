import type { CatalogPagination } from '@/types/catalog'

type PaginationControlsProps = {
  pagination: CatalogPagination
  onPageChange: (page: number) => void
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null
  }

  const visiblePages = buildVisiblePages(pagination.page, pagination.totalPages)
  let previousPage: number | null = null

  return (
    <nav aria-label="Paginacao do catalogo" className="panel flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-steel">
        Pagina <span className="font-semibold text-ink">{pagination.page}</span> de{' '}
        <span className="font-semibold text-ink">{pagination.totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPreviousPage}
          className="brand-chip rounded-full px-3 py-2 text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        {visiblePages.map((page) => {
          const showEllipsis = previousPage !== null && page - previousPage > 1
          previousPage = page

          return (
            <div key={page} className="flex items-center gap-2">
              {showEllipsis ? <span className="px-1 text-sm text-steel">...</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={pagination.page === page ? 'page' : undefined}
                className={`min-w-10 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  pagination.page === page
                    ? 'bg-cobalt text-white shadow-soft'
                    : 'brand-chip text-ink hover:border-amber/40 hover:text-amber'
                }`}
              >
                {page}
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="brand-chip rounded-full px-3 py-2 text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proxima
        </button>
      </div>
    </nav>
  )
}
