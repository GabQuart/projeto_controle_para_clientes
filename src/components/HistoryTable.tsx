'use client'

import Image from 'next/image'
import Link from 'next/link'
import { translateProductRequestDetail } from '@/lib/i18n/content'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useTranslations } from '@/components/providers/LocaleProvider'
import type { RequestHistoryEntry } from '@/types/request'
import { formatDateTime } from '@/lib/utils/format'
import { StatusBadge } from '@/components/StatusBadge'

type HistoryTableProps = {
  requests: RequestHistoryEntry[]
  cancelingId?: string
  onCancel?: (request: RequestHistoryEntry) => void
}

function getHistoryImageSrc(value?: string) {
  const normalized = (value ?? '').trim()

  if (!normalized) {
    return '/placeholder-product.svg'
  }

  if (normalized.startsWith('/')) {
    return normalized
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  return '/placeholder-product.svg'
}

function isDriveUrl(value?: string) {
  return /drive\.google\.com|lh3\.googleusercontent\.com/i.test(value ?? '')
}

function canCancelRequest(request: RequestHistoryEntry) {
  return request.status !== 'concluido' && request.status !== 'cancelado'
}

export function HistoryTable({ requests, cancelingId = '', onCancel }: HistoryTableProps) {
  const t = useTranslations()
  const { locale } = useLocale()

  if (requests.length === 0) {
    return (
      <div className="panel rounded-3xl p-6 text-sm text-steel">
        {t('historyTable.noResults')}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {requests.map((request) => (
        <article key={request.id} className="panel rounded-[28px] p-3.5 sm:p-5">
          {/* Layout: imagem quadrada sempre ao lado do conteúdo */}
          <div className="flex gap-3 sm:gap-4">
            {/* Imagem — quadrada em todos os tamanhos */}
            <div className="brand-glow relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-mist sm:h-20 sm:w-20">
              <Image
                src={getHistoryImageSrc(request.fotoRef)}
                alt={request.titulo}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={isDriveUrl(request.fotoRef)}
              />
            </div>

            {/* Conteúdo */}
            <div className="min-w-0 flex-1">
              {/* Linha 1: loja + status (badge no topo direito) */}
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-amber sm:text-xs">
                  {request.loja}
                </p>
                <StatusBadge status={request.status} />
              </div>

              {/* Linha 2: título */}
              <h3 className="mt-0.5 font-display text-base font-semibold leading-snug tracking-[0.03em] text-ink sm:text-xl">
                {request.titulo}
              </h3>

              {/* Linha 3: chips */}
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-steel sm:gap-2 sm:text-xs">
                <span className="brand-chip rounded-full px-2.5 py-1">
                  {request.tipoSolicitacao === 'novo_produto' ? t('historyTable.newProduct') : t('historyTable.operational')}
                </span>
                {request.skuBase ? (
                  <span className="brand-chip rounded-full px-2.5 py-1">{t('historyTable.catalogSku', { sku: request.skuBase })}</span>
                ) : null}
                {request.skuVariacao ? (
                  <span className="brand-chip rounded-full px-2.5 py-1">{t('historyTable.sku', { sku: request.skuVariacao })}</span>
                ) : null}
                {request.imageCount ? (
                  <span className="brand-chip rounded-full px-2.5 py-1">{t('historyTable.images', { count: request.imageCount })}</span>
                ) : null}
              </div>

              {/* Linha 4: label da solicitação */}
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel sm:text-xs">
                {request.requestLabel}
              </p>

              {/* Linha 5: detalhe (limitado a 2 linhas no mobile) */}
              <p className="mt-1 line-clamp-2 text-sm text-ink/80 sm:line-clamp-none">
                {request.tipoSolicitacao === 'novo_produto'
                  ? translateProductRequestDetail(request.detalhe, locale)
                  : request.detalhe}
              </p>

              {/* Linha 6: acoes + data */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {request.folderUrl ? (
                    <Link
                      href={request.folderUrl}
                      target="_blank"
                      className="inline-flex text-[11px] font-semibold uppercase tracking-[0.18em] text-amber underline-offset-4 hover:underline sm:text-xs"
                    >
                      {t('historyTable.openFolder')}
                    </Link>
                  ) : null}
                  {onCancel && canCancelRequest(request) ? (
                    <button
                      type="button"
                      onClick={() => onCancel(request)}
                      disabled={cancelingId === request.id}
                      className="rounded-full border border-clay/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-clay transition hover:border-clay/60 hover:bg-clay/10 disabled:cursor-wait disabled:opacity-60 sm:text-xs"
                    >
                      {cancelingId === request.id ? t('historyTable.canceling') : t('historyTable.cancelRequest')}
                    </button>
                  ) : null}
                </div>
                <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-steel sm:text-xs">
                  {formatDateTime(request.dataAbertura)}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
