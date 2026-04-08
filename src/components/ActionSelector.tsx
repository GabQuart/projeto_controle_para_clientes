import type { RequestedCatalogAction } from '@/types/request'

const ACTION_OPTIONS: Array<{ value: RequestedCatalogAction; label: string }> = [
  { value: 'ativar', label: 'Ativar' },
  { value: 'inativar', label: 'Inativar' },
  { value: 'alteracao_especifica', label: 'Alteracao especifica' },
]

type ActionSelectorProps = {
  value: RequestedCatalogAction
  onChange: (value: RequestedCatalogAction) => void
  onSubmit: () => void
  buttonLabel?: string
}

export function ActionSelector({ value, onChange, onSubmit, buttonLabel = 'Abrir' }: ActionSelectorProps) {
  return (
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RequestedCatalogAction)}
        className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-amber"
      >
        {ACTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onSubmit}
        className="rounded-full border border-black/10 bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
