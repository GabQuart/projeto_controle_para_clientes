'use client'

import { useRequestQueue } from '@/contexts/RequestQueueContext'

export function QueueStatusBadge() {
  const { pendingCount, isFlushing, flushNow } = useRequestQueue()

  if (pendingCount === 0) return null

  return (
    <button
      type="button"
      onClick={flushNow}
      disabled={isFlushing}
      title={
        isFlushing
          ? 'Enviando solicitações pendentes...'
          : `${pendingCount} solicitação(ões) aguardando conexão. Clique para tentar enviar.`
      }
      className="flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-[11px] font-semibold text-amber transition hover:bg-amber/20 disabled:opacity-60"
    >
      {isFlushing ? (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            d="M12 3a9 9 0 100 18A9 9 0 0012 3z"
            strokeOpacity={0.3}
          />
          <path strokeLinecap="round" d="M12 3a9 9 0 019 9" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
      )}
      <span>{isFlushing ? 'Enviando...' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}</span>
    </button>
  )
}
