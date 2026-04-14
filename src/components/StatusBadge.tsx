import clsx from 'clsx'
import type { RequestHistoryStatus } from '@/types/request'

const LABELS: Record<RequestHistoryStatus, string> = {
  pendente: 'Pendente',
  nao_concluido: 'Nao concluido',
  em_andamento: 'Em andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const STYLES: Record<RequestHistoryStatus, string> = {
  pendente: 'border-[#ffd54a]/55 bg-[#ffd54a]/12 text-[#ffd54a] shadow-[0_0_18px_rgba(255,213,74,0.18)]',
  nao_concluido: 'border-clay/35 bg-clay/10 text-clay',
  em_andamento: 'border-cobalt/40 bg-cobalt/15 text-[#96c4ff]',
  concluido: 'border-pine/35 bg-pine/10 text-pine',
  cancelado: 'border-clay/35 bg-clay/10 text-clay',
}

type StatusBadgeProps = {
  status: RequestHistoryStatus
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
