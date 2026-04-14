'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { useTranslations } from '@/components/providers/LocaleProvider'
import type { RequestedCatalogAction } from '@/types/request'

type ActionSelection = {
  requestedAction: RequestedCatalogAction
  quantity?: number
}

const ACTION_OPTIONS: Array<{
  value: RequestedCatalogAction
  label: string
  className: string
  icon: ReactElement
}> = [
  {
    value: 'ativar',
    label: 'Ativar',
    className: 'border-pine/25 bg-pine/10 text-pine hover:bg-pine/20',
    icon: <path d="M11 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h10.2L9.6 6.4 11 5z" fill="currentColor" />,
  },
  {
    value: 'inativar',
    label: 'Inativar',
    className: 'border-clay/25 bg-clay/10 text-clay hover:bg-clay/20',
    icon: <path d="M6 11h12v2H6z" fill="currentColor" />,
  },
]

type ActionSelectorProps = {
  defaultQuantity?: number
  onSelect: (selection: ActionSelection) => void
}

export function ActionSelector({ defaultQuantity, onSelect }: ActionSelectorProps) {
  const t = useTranslations()
  const [quantity, setQuantity] = useState(defaultQuantity ? String(defaultQuantity) : '')

  useEffect(() => {
    setQuantity(defaultQuantity ? String(defaultQuantity) : '')
  }, [defaultQuantity])

  function parseQuantity() {
    const parsed = Number(quantity)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,140px)_auto_auto] sm:items-center">
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        placeholder={t('actionSelector.quantityPlaceholder')}
        className="brand-chip rounded-full px-4 py-3 text-sm text-ink outline-none placeholder:text-steel focus:border-amber/40"
      />
      {ACTION_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect({ requestedAction: option.value, quantity: option.value === 'ativar' ? parseQuantity() : undefined })}
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${option.className}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            {option.icon}
          </svg>
          <span>{option.value === 'ativar' ? t('actionSelector.activate') : t('actionSelector.deactivate')}</span>
        </button>
      ))}
    </div>
  )
}
