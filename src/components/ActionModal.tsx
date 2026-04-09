'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { CatalogProduct, CatalogVariant } from '@/types/catalog'
import type { UserAccount } from '@/types/account'
import type { ChangeRequestType, RequestedCatalogAction } from '@/types/request'

type SelectedCatalogAction = {
  product: CatalogProduct
  variant?: CatalogVariant
  requestedAction: RequestedCatalogAction
}

type ActionModalProps = {
  open: boolean
  operator: UserAccount | null
  item: SelectedCatalogAction | null
  onClose: () => void
  onCreated: () => void
}

function mapRequestedActionToRequestType(requestedAction: RequestedCatalogAction, isVariantAction: boolean): ChangeRequestType {
  if (requestedAction === 'alteracao_especifica') {
    return 'alteracao_especifica'
  }

  if (requestedAction === 'ativar') {
    return isVariantAction ? 'ativar_variacao' : 'ativar_produto'
  }

  return isVariantAction ? 'inativar_variacao' : 'inativar_produto'
}

function getActionTitle(requestedAction: RequestedCatalogAction) {
  if (requestedAction === 'ativar') {
    return 'Ativar item'
  }

  if (requestedAction === 'inativar') {
    return 'Inativar item'
  }

  return 'Alteracao especifica'
}

function getActionButtonLabel(requestedAction: RequestedCatalogAction) {
  if (requestedAction === 'ativar') {
    return 'Ativar e registrar'
  }

  if (requestedAction === 'inativar') {
    return 'Inativar e registrar'
  }

  return 'Salvar solicitacao'
}

function getActionDescription(requestedAction: RequestedCatalogAction, hasVariant: boolean) {
  if (requestedAction === 'ativar') {
    return hasVariant
      ? 'Confirme o estoque geral para a variacao selecionada antes de ativar.'
      : 'Escolha as variacoes que devem voltar como ativas e informe o estoque geral para elas.'
  }

  if (requestedAction === 'inativar') {
    return hasVariant
      ? 'Revise a variacao selecionada antes de enviar a inativacao.'
      : 'Selecione quais variacoes ativas devem ser inativadas agora.'
  }

  return hasVariant
    ? 'Descreva com clareza a acao esperada para esta variacao.'
    : 'Explique a alteracao desejada e, se quiser, marque as variacoes afetadas.'
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

  if (item.requestedAction === 'inativar') {
    return variants.filter((variant) => Boolean(variant.ativo))
  }

  return variants
}

export function ActionModal({ open, operator, item, onClose, onCreated }: ActionModalProps) {
  const [detalhe, setDetalhe] = useState('')
  const [estoqueGeral, setEstoqueGeral] = useState('')
  const [selectedVariantSkus, setSelectedVariantSkus] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selectableVariants = useMemo(() => getSelectableVariants(item), [item])
  const isVariantAction = Boolean(item?.variant)
  const requestType = useMemo(
    () => (item ? mapRequestedActionToRequestType(item.requestedAction, isVariantAction) : 'alteracao_especifica'),
    [isVariantAction, item],
  )

  useEffect(() => {
    if (!open || !item) {
      return
    }

    setDetalhe('')
    setEstoqueGeral('')
    setFeedback(null)

    if (item.variant) {
      setSelectedVariantSkus([item.variant.sku])
      return
    }

    if (item.requestedAction === 'alteracao_especifica') {
      setSelectedVariantSkus([])
      return
    }

    setSelectedVariantSkus(selectableVariants.map((variant) => variant.sku))
  }, [item, open, selectableVariants])

  if (!open || !item || !operator) {
    return null
  }

  const currentItem = item
  const currentOperator = operator
  const needsStock = currentItem.requestedAction === 'ativar'
  const showVariantSelection = !currentItem.variant && currentItem.product.variacoes.length > 0
  const requiresVariantSelection = !currentItem.variant && currentItem.requestedAction !== 'alteracao_especifica'

  function toggleVariantSelection(sku: string) {
    setSelectedVariantSkus((current) =>
      current.includes(sku) ? current.filter((itemSku) => itemSku !== sku) : [...current, sku],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    if (requiresVariantSelection && selectedVariantSkus.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos uma variacao para concluir essa acao.' })
      setSubmitting(false)
      return
    }

    if (needsStock && !estoqueGeral) {
      setFeedback({ type: 'error', message: 'Preencha o estoque geral para ativar as variacoes selecionadas.' })
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
          detalhe,
          variacoesSelecionadas: selectedVariantSkus,
          estoqueGeral: needsStock ? Number(estoqueGeral) : undefined,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:p-4 sm:items-center">
      <div className="panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{getActionTitle(currentItem.requestedAction)}</p>
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{currentItem.product.titulo}</h2>
            <p className="mt-1 break-all text-sm text-steel">
              {currentItem.product.skuBase}
              {currentItem.variant ? ` | ${currentItem.variant.sku}` : ''}
            </p>
            <p className="mt-2 text-sm text-steel">{getActionDescription(currentItem.requestedAction, isVariantAction)}</p>
          </div>
          <button type="button" onClick={onClose} className="brand-chip shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink">
            Fechar
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="brand-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="brand-chip rounded-2xl p-4 text-sm text-steel">
                <p><span className="font-semibold text-ink">Operador:</span> {currentOperator.nome}</p>
                <p><span className="font-semibold text-ink">Loja:</span> {currentItem.product.loja}</p>
                <p><span className="font-semibold text-ink">Cliente:</span> {currentItem.product.clienteCod}</p>
              </div>
              <div className="brand-chip rounded-2xl p-4 text-sm text-steel">
                <p><span className="font-semibold text-ink">Acao:</span> {getActionTitle(currentItem.requestedAction)}</p>
                <p><span className="font-semibold text-ink">Tipo registrado:</span> {requestType}</p>
                <p><span className="font-semibold text-ink">Variacoes no produto:</span> {currentItem.product.variacoes.length}</p>
              </div>
            </div>

            {showVariantSelection ? (
              <section className="space-y-3 rounded-3xl border border-white/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Variacoes envolvidas</p>
                    <p className="text-sm text-steel">
                      {currentItem.requestedAction === 'alteracao_especifica'
                        ? 'Marque apenas as variacoes afetadas, se quiser detalhar a acao.'
                        : 'Escolha todas ou apenas algumas variacoes elegiveis para essa mudanca.'}
                    </p>
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
            ) : null}

            {needsStock ? (
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                Estoque geral para as variacoes selecionadas
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

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
              Observacao
              <textarea
                value={detalhe}
                onChange={(event) => setDetalhe(event.target.value)}
                rows={5}
                required
                placeholder="Descreva com clareza o que precisa ser ajustado."
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none placeholder:text-steel focus:border-amber/40 sm:text-sm"
              />
            </label>

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
                {submitting ? 'Salvando...' : getActionButtonLabel(currentItem.requestedAction)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
