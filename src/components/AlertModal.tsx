'use client'

import { useTranslations } from '@/components/providers/LocaleProvider'

type AlertModalProps = {
  open: boolean
  title?: string
  message: string
  buttonLabel?: string
  onClose: () => void
}

export function AlertModal({
  open,
  title,
  message,
  buttonLabel,
  onClose,
}: AlertModalProps) {
  const t = useTranslations()

  if (!open) {
    return null
  }

  const resolvedTitle = title ?? t('alerts.title')
  const resolvedButtonLabel = buttonLabel ?? t('alerts.close')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="panel brand-scrollbar max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[24px] p-5 sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{resolvedTitle}</p>
        <p className="mt-4 text-base leading-relaxed text-ink">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#418dff]"
          >
            {resolvedButtonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
