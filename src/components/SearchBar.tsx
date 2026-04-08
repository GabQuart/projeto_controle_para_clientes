import clsx from 'clsx'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function SearchBar({ value, onChange, placeholder = 'Busque por titulo, SKU base ou SKU da variacao', label = 'Busca' }: SearchBarProps) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-sm font-semibold text-ink/80">{label}</span>
      <div className="flex items-center rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm transition focus-within:border-amber focus-within:ring-2 focus-within:ring-amber/20">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-3 h-5 w-5 text-steel">
          <path d="M10.5 4a6.5 6.5 0 104.03 11.6l4.43 4.44 1.41-1.42-4.43-4.43A6.5 6.5 0 0010.5 4zm0 2a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" fill="currentColor" />
        </svg>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={clsx('w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-steel sm:text-sm')}
        />
      </div>
    </label>
  )
}
