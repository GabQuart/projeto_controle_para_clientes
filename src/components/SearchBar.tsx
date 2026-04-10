import clsx from 'clsx'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar por nome ou SKU',
  label = 'Busca',
}: SearchBarProps) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-steel">{label}</span>
      <div className="brand-chip brand-glow flex items-center rounded-2xl px-4 py-3 transition focus-within:border-amber/40">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-3 h-5 w-5 text-amber">
          <path
            d="M10.5 4a6.5 6.5 0 104.03 11.6l4.43 4.44 1.41-1.42-4.43-4.43A6.5 6.5 0 0010.5 4zm0 2a4.5 4.5 0 110 9 4.5 4.5 0 010-9z"
            fill="currentColor"
          />
        </svg>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={clsx(
            'w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-steel sm:text-sm',
          )}
        />
      </div>
    </label>
  )
}
