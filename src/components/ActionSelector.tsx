import type { ReactElement } from 'react'
import type { RequestedCatalogAction } from '@/types/request'

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
  {
    value: 'alteracao_especifica',
    label: 'Alteracao especifica',
    className: 'border-amber/25 bg-amber/10 text-amber hover:bg-amber/20',
    icon: (
      <path
        d="M16.5 3.5l4 4L9 19H5v-4L16.5 3.5zm-8.3 13.7l8.9-8.9-1.2-1.2-8.9 8.9V17h1.2z"
        fill="currentColor"
      />
    ),
  },
]

type ActionSelectorProps = {
  onSelect: (value: RequestedCatalogAction) => void
}

export function ActionSelector({ onSelect }: ActionSelectorProps) {
  return (
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
      {ACTION_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${option.className}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            {option.icon}
          </svg>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
