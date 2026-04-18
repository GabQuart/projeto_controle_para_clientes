import { validateActiveAccount } from '@/lib/services/account.service'
import {
  isTrelloConfigured,
  createTrelloCard,
  buildOperationalCardName,
  buildOperationalCardDesc,
  findTrelloLabelId,
} from '@/lib/services/trello.service'
import { getCatalogSnapshotItem, updateCatalogVariantStatuses } from '@/lib/services/catalog.service'
import { listProductRequestHistory } from '@/lib/services/product-request.service'
import { compactText, normalizeText, toBooleanFlag } from '@/lib/utils/format'
import { createSimpleId } from '@/lib/utils/id'
import { normalizeSku } from '@/lib/utils/sku'
import { createAdminClient } from '@/utils/supabase/admin'
import type {
  BulkCreateRequestInput,
  ChangeRequest,
  ChangeRequestFilters,
  RequestHistoryEntry,
  RequestHistoryType,
  RequestedVariantStock,
} from '@/types/request'
import type { CatalogVariant } from '@/types/catalog'
import type { UserAccount } from '@/types/account'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRODUCT_TABLE = 'catalogo_produtos'
const VARIANT_TABLE = 'variacoes_sku'
const OP_TABLE = 'solicitacoes_operacionais'

const VALID_REQUEST_TYPES = new Set<ChangeRequest['tipoAlteracao']>([
  'ativar_produto',
  'inativar_produto',
  'ativar_variacao',
  'inativar_variacao',
  'alteracao_especifica',
])

const VALID_REQUEST_STATUSES = new Set<ChangeRequest['status']>([
  'nao_concluido',
  'em_andamento',
  'concluido',
  'cancelado',
])

// ─── Utilitários ──────────────────────────────────────────────────────────────

function validateRequestPayload(payload: Partial<ChangeRequest>) {
  const requiredFields = ['operadorEmail', 'skuBase', 'tipoAlteracao'] as const
  const missing = requiredFields.filter((field) => !compactText(String(payload[field] ?? '')))

  if (missing.length > 0) {
    throw new Error(`Campos obrigatorios ausentes: ${missing.join(', ')}`)
  }
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Informe uma quantidade valida para ativacao.')
  }

  return parsed
}

function sanitizeImageReference(value?: string | null) {
  const normalized = compactText(value ?? '')

  if (!normalized) return ''
  if (normalized.startsWith('/')) return normalized
  if (/^https?:\/\//i.test(normalized)) return normalized

  return ''
}

function isValidRequestType(value?: string): value is ChangeRequest['tipoAlteracao'] {
  return VALID_REQUEST_TYPES.has(value as ChangeRequest['tipoAlteracao'])
}

function isValidRequestStatus(value?: string): value is ChangeRequest['status'] {
  return VALID_REQUEST_STATUSES.has(value as ChangeRequest['status'])
}

function formatRequestLabel(tipoAlteracao: ChangeRequest['tipoAlteracao']) {
  if (tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao') return 'Ativacao'
  if (tipoAlteracao === 'inativar_produto' || tipoAlteracao === 'inativar_variacao') return 'Inativacao'
  return tipoAlteracao.replaceAll('_', ' ')
}

function matchesFilters(request: RequestHistoryEntry, filters: ChangeRequestFilters) {
  if (filters.status && request.status !== filters.status) return false
  if (filters.tipoSolicitacao && request.tipoSolicitacao !== filters.tipoSolicitacao) return false
  if (filters.loja && normalizeText(request.loja) !== normalizeText(filters.loja)) return false
  if (filters.nome && !normalizeText(request.titulo).includes(normalizeText(filters.nome))) return false

  if (filters.sku) {
    const normalized = normalizeSku(filters.sku)
    const targets = [
      request.skuBase,
      request.skuVariacao,
      ...(request.variacoesSelecionadas ?? []),
      request.id,
    ].map((item) => normalizeSku(item))

    if (!targets.some((item) => item.includes(normalized))) return false
  }

  return true
}

function resolveSelectedVariants(
  variants: CatalogVariant[],
  payload: Partial<ChangeRequest>,
  fallbackVariant?: CatalogVariant,
) {
  if (fallbackVariant) return [fallbackVariant]

  const requestedSkus = (payload.variacoesSelecionadas ?? []).map((sku) => normalizeSku(sku))
  if (requestedSkus.length === 0) return []

  const requestedSet = new Set(requestedSkus)
  return variants.filter((variant) => requestedSet.has(normalizeSku(variant.sku)))
}

function getEligibleVariants(variants: CatalogVariant[], tipoAlteracao: ChangeRequest['tipoAlteracao']) {
  switch (tipoAlteracao) {
    case 'ativar_produto':
    case 'ativar_variacao':
      return variants.filter((variant) => !variant.ativo)
    case 'inativar_produto':
    case 'inativar_variacao':
      return variants.filter((variant) => Boolean(variant.ativo))
    default:
      return variants
  }
}

function getAlreadyInExpectedStateMessage(tipoAlteracao: ChangeRequest['tipoAlteracao'], isVariantAction: boolean) {
  if (tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao') {
    return isVariantAction
      ? 'A variacao selecionada ja esta ativa.'
      : 'Nao existem variacoes inativas para ativar neste produto.'
  }

  if (tipoAlteracao === 'inativar_produto' || tipoAlteracao === 'inativar_variacao') {
    return isVariantAction
      ? 'A variacao selecionada ja esta inativa.'
      : 'Nao existem variacoes ativas para inativar neste produto.'
  }

  return 'Nenhuma variacao elegivel foi encontrada para esta acao.'
}

function buildStockByVariant(variants: CatalogVariant[], estoqueGeral?: number): RequestedVariantStock[] | undefined {
  if (estoqueGeral === undefined) return undefined

  return variants.map((variant) => ({
    sku: variant.sku,
    cor: variant.cor ?? variant.variacao,
    tamanho: variant.tamanho,
    estoque: estoqueGeral,
  }))
}

function buildActionDetail(input: {
  tipoAlteracao: ChangeRequest['tipoAlteracao']
  titulo: string
  variacoesSelecionadas: string[]
  estoqueGeral?: number
  detalhe?: string
}) {
  const customDetail = compactText(input.detalhe ?? '')
  if (customDetail) return customDetail

  if (input.tipoAlteracao === 'ativar_produto' || input.tipoAlteracao === 'ativar_variacao') {
    return `Ativacao solicitada para ${input.variacoesSelecionadas.length} variacao(oes) do produto ${input.titulo} com quantidade ${input.estoqueGeral ?? 0}.`
  }

  return `Inativacao solicitada para ${input.variacoesSelecionadas.length} variacao(oes) do produto ${input.titulo}.`
}

// ─── Mapeamento Supabase → RequestHistoryEntry ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHistoryEntry(row: Record<string, any>): RequestHistoryEntry | null {
  const tipoAlteracao = compactText(row.tipo_alteracao ?? '')
  const status = compactText(row.status ?? '')
  const tipoSolicitacao = compactText(row.tipo_solicitacao ?? '') as RequestHistoryType

  if (!row.id || !isValidRequestType(tipoAlteracao) || !isValidRequestStatus(status)) {
    return null
  }

  return {
    id: row.id,
    loteId: row.lote_id ?? '',
    dataAbertura: row.data_abertura ?? '',
    operadorEmail: row.operador_email ?? '',
    operadorNome: row.operador_nome ?? '',
    clienteCod: row.cliente_cod ?? '',
    loja: row.loja ?? '',
    skuBase: row.sku_base ?? '',
    skuVariacao: row.sku_variacao ?? '',
    titulo: row.titulo ?? '',
    fotoRef: sanitizeImageReference(row.foto_ref),
    tipoAlteracao,
    detalhe: row.detalhe ?? '',
    status: status as RequestHistoryEntry['status'],
    responsavelInterno: row.responsavel_interno ?? '',
    dataConclusao: row.data_conclusao ?? '',
    variacoesSelecionadas: Array.isArray(row.variacoes_selecionadas) ? row.variacoes_selecionadas : undefined,
    estoqueGeral: row.estoque_geral ? Number(row.estoque_geral) : undefined,
    estoquePorVariacao: Array.isArray(row.estoque_por_variacao) ? row.estoque_por_variacao : undefined,
    tipoSolicitacao: tipoSolicitacao === 'novo_produto' ? 'novo_produto' : 'operacional',
    requestLabel: formatRequestLabel(tipoAlteracao),
  }
}

// ─── Sync de status no catálogo (Supabase) ────────────────────────────────────

export async function applyOperationalStatusChange(
  skuBase: string,
  variantSkus: string[],
  nextActive: boolean,
): Promise<void> {
  const supabase = createAdminClient()
  const nextVariantStatus = nextActive ? 'SIM' : 'NAO'

  if (variantSkus.length > 0) {
    const { error: variantError } = await supabase
      .from(VARIANT_TABLE)
      .update({ status: nextVariantStatus })
      .in('sku', variantSkus)

    if (variantError) {
      throw new Error(`Falha ao atualizar variacoes no Supabase: ${variantError.message}`)
    }
  }

  const { data: currentVariants, error: readError } = await supabase
    .from(VARIANT_TABLE)
    .select('sku,status')
    .eq('sku_base', skuBase)

  if (readError) {
    throw new Error(`Falha ao recalcular status do produto no Supabase: ${readError.message}`)
  }

  const hasActiveVariant = (currentVariants ?? []).some((variant) => toBooleanFlag(variant.status))
  const nextProductStatus = hasActiveVariant ? 'ATIVO' : 'INATIVO'

  const { error: productError } = await supabase
    .from(PRODUCT_TABLE)
    .update({ status: nextProductStatus })
    .eq('sku_base', skuBase)

  if (productError) {
    throw new Error(`Falha ao atualizar produto no Supabase: ${productError.message}`)
  }

  await updateCatalogVariantStatuses(Object.fromEntries(variantSkus.map((sku) => [sku, nextActive])))
}

// ─── Criar solicitação (interno) ──────────────────────────────────────────────

async function createRequestInternal(
  payload: Partial<ChangeRequest>,
  options: { account?: UserAccount; loteId?: string } = {},
) {
  validateRequestPayload(payload)

  const tipoAlteracao = payload.tipoAlteracao as ChangeRequest['tipoAlteracao']
  const account = options.account ?? (await validateActiveAccount(payload.operadorEmail as string))
  const snapshot = await getCatalogSnapshotItem({
    skuBase: payload.skuBase as string,
    skuVariacao: payload.skuVariacao,
    forceRefresh: true,
  })

  const selectedVariants = resolveSelectedVariants(snapshot.product.variacoes, payload, snapshot.variant)
  const scopedVariants =
    snapshot.variant
      ? [snapshot.variant]
      : selectedVariants.length > 0
        ? selectedVariants
        : snapshot.product.variacoes
  const eligibleVariants = getEligibleVariants(scopedVariants, tipoAlteracao)
  const estoqueGeral =
    tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao'
      ? parseOptionalNumber(payload.estoqueGeral)
      : undefined

  if ((tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao') && estoqueGeral === undefined) {
    throw new Error('Preencha a quantidade para concluir a ativacao.')
  }

  if (
    (tipoAlteracao === 'ativar_produto' ||
      tipoAlteracao === 'ativar_variacao' ||
      tipoAlteracao === 'inativar_produto' ||
      tipoAlteracao === 'inativar_variacao') &&
    eligibleVariants.length === 0
  ) {
    throw new Error(getAlreadyInExpectedStateMessage(tipoAlteracao, Boolean(snapshot.variant)))
  }

  const variacoesSelecionadas = eligibleVariants.map((variant) => variant.sku)
  const estoquePorVariacao = buildStockByVariant(eligibleVariants, estoqueGeral)
  const detalhe = buildActionDetail({
    tipoAlteracao,
    titulo: snapshot.product.titulo,
    variacoesSelecionadas,
    estoqueGeral,
    detalhe: payload.detalhe,
  })

  const request: ChangeRequest = {
    id: createSimpleId('solicitacao'),
    loteId: options.loteId,
    dataAbertura: new Date().toISOString(),
    operadorEmail: account.email,
    operadorNome: account.nome,
    clienteCod: snapshot.product.clienteCod,
    loja: snapshot.product.loja,
    skuBase: snapshot.product.skuBase,
    skuVariacao:
      snapshot.variant?.sku ??
      (variacoesSelecionadas.length === 1 ? variacoesSelecionadas[0] : payload.skuVariacao),
    titulo: snapshot.product.titulo,
    fotoRef: snapshot.product.fotoRef,
    tipoAlteracao,
    detalhe,
    status: 'nao_concluido',
    responsavelInterno: payload.responsavelInterno,
    dataConclusao: payload.dataConclusao,
    variacoesSelecionadas,
    estoqueGeral,
    estoquePorVariacao,
    tipoSolicitacao: 'operacional',
  }

  // Salva no Supabase (status do catálogo só muda quando Trello confirmar via webhook)
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from(OP_TABLE).insert({
    id: request.id,
    lote_id: request.loteId ?? null,
    data_abertura: request.dataAbertura,
    operador_email: request.operadorEmail,
    operador_nome: request.operadorNome,
    cliente_cod: request.clienteCod ?? null,
    loja: request.loja,
    sku_base: request.skuBase,
    sku_variacao: request.skuVariacao ?? null,
    titulo: request.titulo,
    foto_ref: request.fotoRef ?? null,
    tipo_alteracao: request.tipoAlteracao,
    detalhe: request.detalhe,
    status: request.status,
    responsavel_interno: request.responsavelInterno ?? null,
    data_conclusao: request.dataConclusao ?? null,
    variacoes_selecionadas: request.variacoesSelecionadas ?? null,
    estoque_geral: request.estoqueGeral ?? null,
    estoque_por_variacao: request.estoquePorVariacao ?? null,
    enviado_trello: false,
    trello_card_id: null,
    tipo_solicitacao: request.tipoSolicitacao ?? 'operacional',
  })

  if (dbError) {
    throw new Error(`Falha ao registrar solicitacao: ${dbError.message}`)
  }

  // Cria card no Trello (se configurado) — falha silenciosa
  const trelloListId = process.env.TRELLO_LIST_ATIVACAO_ENTRADA_ID ?? ''
  const trelloBoardId = process.env.TRELLO_BOARD_ATIVACAO_ID ?? ''

  if (isTrelloConfigured() && trelloListId) {
    try {
      const isAtivar = tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao'
      const labelName = isAtivar ? 'ATIVAR' : 'INATIVAR'

      const [cardName, cardDesc, labelId] = await Promise.all([
        Promise.resolve(buildOperationalCardName(tipoAlteracao, request.titulo, request.skuBase)),
        Promise.resolve(
          buildOperationalCardDesc({
            loja: request.loja,
            operadorNome: request.operadorNome,
            variacoes: request.variacoesSelecionadas ?? [],
            estoqueGeral: request.estoqueGeral,
            detalhe: request.detalhe,
            dataPedido: new Date(request.dataAbertura),
          }),
        ),
        trelloBoardId ? findTrelloLabelId(trelloBoardId, labelName) : Promise.resolve(''),
      ])

      const cardId = await createTrelloCard({
        listId: trelloListId,
        name: cardName,
        desc: cardDesc,
        ...(labelId ? { labelIds: [labelId] } : {}),
      })

      if (cardId) {
        await supabase
          .from(OP_TABLE)
          .update({ trello_card_id: cardId, enviado_trello: true })
          .eq('id', request.id)
      }
    } catch (trelloError) {
      console.warn('[request] Falha ao criar card no Trello:', trelloError instanceof Error ? trelloError.message : trelloError)
    }
  }

  return request
}

// ─── Exports públicos ─────────────────────────────────────────────────────────

export async function createRequest(payload: Partial<ChangeRequest>) {
  return createRequestInternal(payload)
}

export async function createBatchRequests(payload: BulkCreateRequestInput) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Selecione pelo menos um produto para enviar a acao em lote.')
  }

  const account = await validateActiveAccount(payload.operadorEmail)
  const loteId = createSimpleId('lote')
  const uniqueSkuBases = Array.from(
    new Set(payload.items.map((item) => normalizeSku(item.skuBase)).filter(Boolean)),
  )
  const created: ChangeRequest[] = []
  const errors: { skuBase: string; message: string }[] = []

  for (const skuBase of uniqueSkuBases) {
    try {
      const request = await createRequestInternal(
        {
          operadorEmail: payload.operadorEmail,
          skuBase,
          tipoAlteracao: payload.tipoAlteracao,
          detalhe: payload.detalhe,
          estoqueGeral: payload.estoqueGeral,
        },
        { account, loteId },
      )

      created.push(request)
    } catch (error) {
      errors.push({
        skuBase,
        message: error instanceof Error ? error.message : 'Falha ao processar produto em lote',
      })
    }
  }

  return { loteId, created, errors }
}

export async function listRequests(filters: ChangeRequestFilters = {}) {
  const supabase = createAdminClient()

  // ── Solicitações operacionais (Supabase) ──────────────────────────────────
  let opQuery = supabase
    .from(OP_TABLE)
    .select('*')
    .order('data_abertura', { ascending: false })

  if (filters.status) opQuery = opQuery.eq('status', filters.status)
  if (filters.loja) opQuery = opQuery.eq('loja', filters.loja)
  if (filters.nome) opQuery = opQuery.ilike('titulo', `%${filters.nome}%`)

  if (filters.tipoSolicitacao === 'novo_produto') {
    // Apenas novos produtos — não lê tabela operacional
    const productRequests = await listProductRequestHistory(filters)
    return productRequests
  }

  const { data: opRows } = await opQuery

  const operationalRequests = (opRows ?? [])
    .map((row) => rowToHistoryEntry(row as Record<string, unknown>))
    .filter((r): r is RequestHistoryEntry => r !== null)
    .filter((r) => matchesFilters(r, filters))

  // ── Solicitações de novo produto (Supabase) ───────────────────────────────
  const productRequests =
    filters.tipoSolicitacao === 'operacional' ? [] : await listProductRequestHistory(filters)

  return [...operationalRequests, ...productRequests].sort(
    (a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime(),
  )
}
