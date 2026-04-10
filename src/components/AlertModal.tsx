'use client'

type AlertModalProps = {
  open: boolean
  title?: string
  message: string
  buttonLabel?: string
  onClose: () => void
}

export function AlertModal({
  open,
  title = 'Aviso',
  message,
  buttonLabel = 'Fechar',
  onClose,
}: AlertModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-[28px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{title}</p>
        <p className="mt-4 text-base leading-relaxed text-ink">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#418dff]"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
