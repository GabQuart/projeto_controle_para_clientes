'use client'

type LoadingOverlayProps = {
  open: boolean
  label?: string
}

export function LoadingOverlay({ open, label = 'Carregando...' }: LoadingOverlayProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-night/65 backdrop-blur-[2px]">
      <div className="panel flex min-w-[220px] flex-col items-center gap-4 rounded-[28px] px-8 py-7 text-center">
        <span className="loading-ring" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">{label}</p>
      </div>
    </div>
  )
}
