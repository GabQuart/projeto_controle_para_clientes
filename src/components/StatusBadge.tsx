import clsx from 'clsx'
import type { ChangeRequestStatus } from '@/types/request'

const LABELS: Record<ChangeRequestStatus, string> = {
  nao_concluido: 'Nao concluido',
  em_andamento: 'Em andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const STYLES: Record<ChangeRequestStatus, string> = {
  nao_concluido: 'border-amber/30 bg-amber/10 text-amber',
  em_andamento: 'border-sky-300 bg-sky-50 text-sky-700',
  concluido: 'border-pine/30 bg-pine/10 text-pine',
  cancelado: 'border-clay/30 bg-clay/10 text-clay',
}

type StatusBadgeProps = {
  status: ChangeRequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', STYLES[status])}>
      {LABELS[status]}
    </span>
  )
}
