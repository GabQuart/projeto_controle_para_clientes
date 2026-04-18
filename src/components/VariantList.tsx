'use client'

import { translateColorLabel, translateVariationValue } from '@/lib/i18n/content'
import { useTranslations } from '@/components/providers/LocaleProvider'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { RequestedCatalogAction } from '@/types/request'
import { ActionSelector } from '@/components/ActionSelector'

export type PendingVariantStatus = 'ativacao' | 'inativacao'

type VariantListProps = {
  product: CatalogProduct
  onAction: (input: { product: CatalogProduct; variant: CatalogVariant; requestedAction: RequestedCatalogAction; quantity?: number }) => void
  pendingVariantSkus?: Record<string, PendingVariantStatus>
}

function getVariantStatusChip(variant: CatalogVariant, pendingStatus: PendingVariantStatus | undefined, labels: { active: string; inactive: string; pendingActivation: string; pendingDeactivation: string }) {
  if (pendingStatus) {
    const label = pendingStatus === 'ativacao' ? labels.pendingActivation : labels.pendingDeactivation
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd54a]/55 bg-[#ffd54a]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffd54a] shadow-[0_0_8px_rgba(255,213,74,0.15)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd54a] animate-pulse" />
        {label}
      </span>
    )
  }

  if (!variant.ativo) {
    return <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">{labels.inactive}</span>
  }

  return <span className="inline-flex rounded-full border border-pine/35 bg-pine/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">{labels.active}</span>
}

function getVariantDisplayLabel(variant: CatalogVariant, labels: { noColor: string; noSize: string }) {
  const colorLabel = variant.cor || variant.variacao || labels.noColor
  const sizeLabel = variant.tamanho || labels.noSize
  return `${colorLabel} | ${sizeLabel}`
}

function VariantActionRow({
  product,
  variant,
  pendingStatus,
  onAction,
}: {
  product: CatalogProduct
  variant: CatalogVariant
  pendingStatus?: PendingVariantStatus
  onAction: (input: { product: CatalogProduct; variant: CatalogVariant; requestedAction: RequestedCatalogAction; quantity?: number }) => void
}) {
  const t = useTranslations()
  const { locale } = useLocale()
  const isInactive = !variant.ativo
  const isPending = Boolean(pendingStatus)
  const translatedColor = translateColorLabel(variant.cor || '', locale)
  const translatedVariation = translateVariationValue(variant.variacao || '', locale)
  const displayVariant: CatalogVariant = {
    ...variant,
    cor: translatedColor || variant.cor,
    variacao: translatedVariation || variant.variacao,
  }

  const rowClass = isPending
    ? 'rounded-2xl p-3 border border-[#ffd54a]/40 bg-[#ffd54a]/[0.05] shadow-[0_0_12px_rgba(255,213,74,0.08)]'
    : isInactive
      ? 'rounded-2xl p-3 border border-white/12 bg-[linear-gradient(180deg,rgba(43,49,60,0.72),rgba(24,28,36,0.82))]'
      : 'brand-chip rounded-2xl p-3'

  return (
    <div className={rowClass}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className={`min-w-0 space-y-2 ${isInactive && !isPending ? 'opacity-85' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={`break-all text-sm font-semibold ${isPending ? 'text-[#ffd54a]/90' : isInactive ? 'text-slate-200' : 'text-ink'}`}>
              {getVariantDisplayLabel(displayVariant, { noColor: t('variants.noColor'), noSize: t('variants.noSize') })}
            </p>
            {getVariantStatusChip(variant, pendingStatus, {
              active: t('variants.active'),
              inactive: t('variants.inactive'),
              pendingActivation: t('variants.pendingActivation'),
              pendingDeactivation: t('variants.pendingDeactivation'),
            })}
          </div>
        </div>
        <ActionSelector onSelect={({ requestedAction, quantity }) => onAction({ product, variant, requestedAction, quantity })} />
      </div>
    </div>
  )
}

export function VariantList({ product, onAction, pendingVariantSkus }: VariantListProps) {
  const t = useTranslations()
  if (product.variacoes.length === 0) {
    return <p className="brand-chip rounded-2xl px-4 py-3 text-sm text-steel">{t('variants.noVariants')}</p>
  }

  return (
    <div className="grid gap-3">
      {product.variacoes.map((variant) => (
        <VariantActionRow
          key={variant.id}
          product={product}
          variant={variant}
          pendingStatus={pendingVariantSkus?.[variant.sku]}
          onAction={onAction}
        />
      ))}
    </div>
  )
}
