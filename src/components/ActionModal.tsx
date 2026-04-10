'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { UserAccount } from '@/types/account'
import type { ChangeRequestType, RequestedCatalogAction } from '@/types/request'

export type CompletedCatalogAction = {
  skuBase: string
  updatedVariantSkus: string[]
  nextActive: boolean
}

type SelectedCatalogAction = {
  product: CatalogProduct
  variant?: CatalogVariant
  requestedAction: RequestedCatalogAction
  quantity?: number
}

type ActionModalProps = {
  open: boolean
  operator: UserAccount | null
  item: SelectedCatalogAction | null
  onClose: () => void
  onCreated: (result: CompletedCatalogAction) => void
}

function mapRequestedActionToRequestType(requestedAction: RequestedCatalogAction, isVariantAction: boolean): ChangeRequestType {
  if (requestedAction === 'ativar') {
    return isVariantAction ? 'ativar_variacao' : 'ativar_produto'
  }

  return isVariantAction ? 'inativar_variacao' : 'inativar_produto'
}

function getSelectableVariants(item: SelectedCatalogAction | null) {
  if (!item) {
    return []
  }

  const variants = item.product.variacoes

  if (item.variant) {
    return [item.variant]
  }

  if (item.requestedAction === 'ativar') {
    return variants.filter((variant) => !variant.ativo)
  }

  return variants.filter((variant) => Boolean(variant.ativo))
}

export function ActionModal({ open, operator, item, onClose, onCreated }: ActionModalProps) {
  const [estoqueGeral, setEstoqueGeral] = useState('')
  const [selectedVariantSkus, setSelectedVariantSkus] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selectableVariants = useMemo(() => getSelectableVariants(item), [item])
  const isVariantAction = Boolean(item?.variant)
  const requestType = useMemo(
    () => (item ? mapRequestedActionToRequestType(item.requestedAction, isVariantAction) : 'inativar_produto'),
    [isVariantAction, item],
  )

  useEffect(() => {
    if (!open || !item) {
      return
    }

    setFeedback(null)
    setEstoqueGeral(item.quantity ? String(item.quantity) : '')
    setSelectedVariantSkus(selectableVariants.map((variant) => variant.sku))
  }, [item, open, selectableVariants])

  if (!open || !item || !operator) {
    return null
  }

  const currentItem = item
  const currentOperator = operator
  const needsStock = currentItem.requestedAction === 'ativar'
  const canPickVariants = currentItem.requestedAction === 'ativar' && !currentItem.variant && selectableVariants.length > 1

  function toggleVariantSelection(sku: string) {
    setSelectedVariantSkus((current) =>
      current.includes(sku) ? current.filter((itemSku) => itemSku !== sku) : [...current, sku],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    if (selectedVariantSkus.length === 0) {
      setFeedback({ type: 'error', message: 'Nao existe variacao elegivel para esta acao.' })
      setSubmitting(false)
      return
    }

    if (needsStock && !estoqueGeral) {
      setFeedback({ type: 'error', message: 'Preencha a quantidade para ativar as variacoes selecionadas.' })
      setSubmitting(false)
      return
    }

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
          tipoAlteracao: requestType,
          variacoesSelecionadas: selectedVariantSkus,
          estoqueGeral: needsStock ? Number(estoqueGeral) : undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel salvar a solicitacao')
      }

      setFeedback({ type: 'success', message: 'Acao enviada para a fila com sucesso.' })
      onCreated({
        skuBase: currentItem.product.skuBase,
        updatedVariantSkus: selectedVariantSkus,
        nextActive: currentItem.requestedAction === 'ativar',
      })
      window.setTimeout(() => onClose(), 700)
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">
              {currentItem.requestedAction === 'ativar' ? 'Confirmar ativacao' : 'Confirmar inativacao'}
            </p>
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{currentItem.product.titulo}</h2>
            <p className="mt-1 break-all text-sm text-steel">
              {currentItem.product.skuBase}
              {currentItem.variant ? ` | ${currentItem.variant.sku}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink">
            Fechar
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="brand-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="brand-chip rounded-2xl p-4 text-sm text-steel">
                <p><span className="font-semibold text-ink">Loja:</span> {currentItem.product.loja}</p>
                <p><span className="font-semibold text-ink">SKU:</span> {currentItem.product.skuBase}</p>
                <p><span className="font-semibold text-ink">Usuario:</span> {currentOperator.nome}</p>
              </div>
              <div className="brand-chip rounded-2xl p-4 text-sm text-steel">
                <p><span className="font-semibold text-ink">Acao:</span> {currentItem.requestedAction === 'ativar' ? 'Ativar' : 'Inativar'}</p>
                <p><span className="font-semibold text-ink">Variacoes:</span> {selectedVariantSkus.length}</p>
              </div>
            </div>

            {needsStock ? (
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                Quantidade
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={estoqueGeral}
                  onChange={(event) => setEstoqueGeral(event.target.value)}
                  placeholder="Ex.: 20"
                  className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                />
              </label>
            ) : null}

            {canPickVariants ? (
              <section className="space-y-3 rounded-3xl border border-white/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Variacoes</p>
                    <p className="text-sm text-steel">Escolha o que sera ativado.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVariantSkus(selectableVariants.map((variant) => variant.sku))}
                      className="brand-chip rounded-full px-3 py-2 text-xs font-semibold text-ink"
                    >
                      Selecionar todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVariantSkus([])}
                      className="brand-chip rounded-full px-3 py-2 text-xs font-semibold text-ink"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  {selectableVariants.map((variant) => (
                    <label key={variant.sku} className="brand-chip flex items-start gap-3 rounded-2xl px-3 py-3 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={selectedVariantSkus.includes(variant.sku)}
                        onChange={() => toggleVariantSelection(variant.sku)}
                        className="mt-1 h-4 w-4 rounded border-white/10 bg-slate text-amber focus:ring-amber"
                      />
                      <span className="min-w-0">
                        <span className="block break-all font-semibold">{variant.sku}</span>
                        <span className="block text-steel">
                          {[variant.cor || variant.variacao, variant.tamanho].filter(Boolean).join(' | ') || 'Sem detalhamento adicional'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : (
              <div className="brand-chip rounded-2xl p-4 text-sm text-steel">
                {selectedVariantSkus.length === 1
                  ? `Variacao selecionada: ${selectedVariantSkus[0]}`
                  : `${selectedVariantSkus.length} variacao(oes) selecionada(s)`}
              </div>
            )}

            {feedback ? (
              <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border border-pine/30 bg-pine/10 text-pine' : 'border border-clay/30 bg-clay/10 text-clay'}`}>
                {feedback.message}
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:flex sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : currentItem.requestedAction === 'ativar' ? 'Confirmar ativacao' : 'Confirmar inativacao'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
