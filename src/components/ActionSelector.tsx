import type { RequestedCatalogAction } from '@/types/request'

const ACTION_OPTIONS: Array<{ value: RequestedCatalogAction; label: string; className: string }> = [
  {
    value: 'ativar',
    label: 'Ativar',
    className: 'border-pine/20 bg-pine/10 text-pine hover:bg-pine/20',
  },
  {
    value: 'inativar',
    label: 'Inativar',
    className: 'border-clay/20 bg-clay/10 text-clay hover:bg-clay/20',
  },
  {
    value: 'alteracao_especifica',
    label: 'Alteracao especifica',
    className: 'border-amber/20 bg-amber/10 text-amber hover:bg-amber/20',
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
          className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${option.className}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
