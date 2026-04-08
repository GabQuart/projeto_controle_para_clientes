'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { ChangeRequestType } from '@/types/request'
import type { Operator } from '@/types/operator'

const PRODUCT_ACTIONS: Array<{ value: ChangeRequestType; label: string }> = [
  { value: 'ativar_produto', label: 'Ativar produto' },
  { value: 'inativar_produto', label: 'Inativar produto' },
  { value: 'alteracao_especifica', label: 'Alteracao especifica' },
]

const VARIANT_ACTIONS: Array<{ value: ChangeRequestType; label: string }> = [
  { value: 'ativar_variacao', label: 'Ativar variacao' },
  { value: 'inativar_variacao', label: 'Inativar variacao' },
  { value: 'alteracao_especifica', label: 'Alteracao especifica' },
]

type ActionModalProps = {
  open: boolean
  operator: Operator | null
  item: { product: CatalogProduct; variant?: CatalogVariant } | null
  onClose: () => void
  onCreated: () => void
}

export function ActionModal({ open, operator, item, onClose, onCreated }: ActionModalProps) {
  const [tipoAlteracao, setTipoAlteracao] = useState<ChangeRequestType>('alteracao_especifica')
  const [detalhe, setDetalhe] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const actionOptions = useMemo(() => (item?.variant ? VARIANT_ACTIONS : PRODUCT_ACTIONS), [item])

  useEffect(() => {
    if (!open) {
      return
    }

    setTipoAlteracao(item?.variant ? 'inativar_variacao' : 'inativar_produto')
    setDetalhe('')
    setFeedback(null)
  }, [item, open])

  if (!open || !item || !operator) {
    return null
  }

  const currentItem = item
  const currentOperator = operator

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operadorEmail: currentOperator.email,
          clienteCod: currentItem.product.clienteCod,
          loja: currentItem.product.loja,
          skuBase: currentItem.product.skuBase,
          skuVariacao: currentItem.variant?.sku,
          titulo: currentItem.product.titulo,
          tipoAlteracao,
          detalhe,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel salvar a solicitacao')
      }

      setFeedback({ type: 'success', message: 'Solicitacao registrada com sucesso.' })
      onCreated()
      window.setTimeout(() => onClose(), 900)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao salvar solicitacao.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:p-4 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber">Nova solicitacao</p>
            <h2 className="text-lg font-black text-ink sm:text-2xl">{currentItem.product.titulo}</h2>
            <p className="mt-1 break-all text-sm text-steel">
              {currentItem.product.skuBase}
              {currentItem.variant ? ` | ${currentItem.variant.sku}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold text-ink">
            Fechar
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-ink/80">
                Tipo de alteracao
                <select
                  value={tipoAlteracao}
                  onChange={(event) => setTipoAlteracao(event.target.value as ChangeRequestType)}
                  className="rounded-2xl border border-black/10 bg-mist px-4 py-3 text-base outline-none focus:border-amber sm:text-sm"
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl bg-mist p-4 text-sm text-ink/80">
                <p><span className="font-semibold">Operador:</span> {currentOperator.nome}</p>
                <p><span className="font-semibold">Loja:</span> {currentItem.product.loja}</p>
                <p><span className="font-semibold">Cliente:</span> {currentItem.product.clienteCod}</p>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-ink/80">
              Observacao
              <textarea
                value={detalhe}
                onChange={(event) => setDetalhe(event.target.value)}
                rows={5}
                required
                placeholder="Descreva com clareza o que precisa ser ajustado."
                className="rounded-2xl border border-black/10 bg-mist px-4 py-3 text-base outline-none focus:border-amber sm:text-sm"
              />
            </label>

            {feedback ? (
              <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-pine/10 text-pine' : 'bg-clay/10 text-clay'}`}>
                {feedback.message}
              </div>
            ) : null}
          </div>

          <div className="border-t border-black/10 px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:flex sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Salvar solicitacao'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
