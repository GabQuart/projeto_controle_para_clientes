import Image from 'next/image'
import type { ChangeRequest } from '@/types/request'
import { formatDateTime } from '@/lib/utils/format'
import { StatusBadge } from '@/components/StatusBadge'

type HistoryTableProps = {
  requests: ChangeRequest[]
}

export function HistoryTable({ requests }: HistoryTableProps) {
  if (requests.length === 0) {
    return (
      <div className="panel rounded-3xl p-6 text-sm text-steel">
        Nenhuma solicitacao encontrada para os filtros atuais.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <article key={request.id} className="panel rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-20 w-full overflow-hidden rounded-2xl bg-mist sm:w-20">
                <Image
                  src={request.fotoRef || '/placeholder-product.svg'}
                  alt={request.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 80px"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-steel">{request.loja}</p>
                  <h3 className="text-base font-black text-ink sm:text-lg">{request.titulo}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-steel sm:text-sm">
                  <span className="rounded-full bg-ink/5 px-3 py-1">SKU base: {request.skuBase}</span>
                  {request.skuVariacao ? <span className="rounded-full bg-ink/5 px-3 py-1">Variacao: {request.skuVariacao}</span> : null}
                  <span className="rounded-full bg-ink/5 px-3 py-1">Operador: {request.operadorNome}</span>
                </div>
                <p className="text-sm text-ink/80">{request.tipoAlteracao.replaceAll('_', ' ')}</p>
                <p className="text-sm text-steel">{request.detalhe}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 border-t border-black/10 pt-3 sm:border-t-0 sm:pt-0 lg:items-end">
              <StatusBadge status={request.status} />
              <p className="text-xs font-medium text-steel">{formatDateTime(request.dataAbertura)}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
