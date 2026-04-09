import clsx from 'clsx'
import type { ChangeRequestStatus } from '@/types/request'

const LABELS: Record<ChangeRequestStatus, string> = {
  nao_concluido: 'Nao concluido',
  em_andamento: 'Em andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const STYLES: Record<ChangeRequestStatus, string> = {
  nao_concluido: 'border-amber/35 bg-amber/10 text-amber',
  em_andamento: 'border-cobalt/40 bg-cobalt/15 text-[#96c4ff]',
  concluido: 'border-pine/35 bg-pine/10 text-pine',
  cancelado: 'border-clay/35 bg-clay/10 text-clay',
}

type StatusBadgeProps = {
  status: ChangeRequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  )
}
