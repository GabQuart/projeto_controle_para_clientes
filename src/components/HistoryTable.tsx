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

export function HistoryTable({ requests }: HistoryTableProps) {
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
    <div className="grid gap-4">
      {requests.map((request) => (
        <article key={request.id} className="panel rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="brand-glow relative h-20 w-full overflow-hidden rounded-2xl border border-white/10 bg-mist sm:w-20">
                <Image
                  src={getHistoryImageSrc(request.fotoRef)}
                  alt={request.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 80px"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{request.loja}</p>
                  <h3 className="font-display text-xl font-semibold tracking-[0.04em] text-ink">{request.titulo}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
                  <span className="brand-chip rounded-full px-3 py-1">
                    {request.tipoSolicitacao === 'novo_produto' ? t('historyTable.newProduct') : t('historyTable.operational')}
                  </span>
                  {request.skuBase ? <span className="brand-chip rounded-full px-3 py-1">{t('historyTable.catalogSku', { sku: request.skuBase })}</span> : null}
                  {request.skuVariacao ? (
                    <span className="brand-chip rounded-full px-3 py-1">{t('historyTable.sku', { sku: request.skuVariacao })}</span>
                  ) : null}
                  {request.imageCount ? (
                    <span className="brand-chip rounded-full px-3 py-1">{t('historyTable.images', { count: request.imageCount })}</span>
                  ) : null}
                </div>
                <p className="text-sm uppercase tracking-[0.18em] text-steel">{request.requestLabel}</p>
                <p className="text-sm text-ink/80">
                  {request.tipoSolicitacao === 'novo_produto' ? translateProductRequestDetail(request.detalhe, locale) : request.detalhe}
                </p>
                {request.folderUrl ? (
                  <Link
                    href={request.folderUrl}
                    target="_blank"
                    className="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-amber underline-offset-4 hover:underline"
                  >
                    {t('historyTable.openFolder')}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0 lg:items-end">
              <StatusBadge status={request.status} />
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-steel">{formatDateTime(request.dataAbertura)}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
