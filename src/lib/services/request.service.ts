import { appendSheetRow, getSpreadsheetSheetTitles, readSheetTab, updateRowsByLookup, updateSheetRow } from '@/lib/google/sheets'
import { validateActiveAccount } from '@/lib/services/account.service'
import { getCatalogSnapshotItem, updateCatalogVariantStatuses } from '@/lib/services/catalog.service'
import { compactText, normalizeText } from '@/lib/utils/format'
import { createSimpleId } from '@/lib/utils/id'
import { normalizeSku } from '@/lib/utils/sku'
import type { BulkCreateRequestInput, ChangeRequest, ChangeRequestFilters, RequestedVariantStock } from '@/types/request'
import type { CatalogVariant } from '@/types/catalog'
import type { UserAccount } from '@/types/account'

const OUTPUT_SHEET_ID = process.env.GOOGLE_OUTPUT_SHEET_ID ?? ''
const SOURCE_SHEET_ID = process.env.GOOGLE_SOURCE_SHEET_ID ?? ''
const SOURCE_VARIANT_SHEET = 'VARIACOES_SKU'
const REQUEST_HEADERS = [
  'id',
  'loteId',
  'dataAbertura',
  'operadorEmail',
  'operadorNome',
  'clienteCod',
  'loja',
  'skuBase',
  'skuVariacao',
  'titulo',
  'fotoRef',
  'tipoAlteracao',
  'detalhe',
  'status',
  'responsavelInterno',
  'dataConclusao',
  'variacoesSelecionadas',
  'estoqueGeral',
  'estoquePorVariacao',
] as const

let cachedOutputSheetName = ''

async function getOutputSheetName() {
  if (cachedOutputSheetName) {
    return cachedOutputSheetName
  }

  const envSheetName = process.env.GOOGLE_OUTPUT_SHEET_NAME
  if (envSheetName) {
    cachedOutputSheetName = envSheetName
    return cachedOutputSheetName
  }

  const titles = await getSpreadsheetSheetTitles(OUTPUT_SHEET_ID)
  cachedOutputSheetName = titles[0] ?? 'Pagina1'
  return cachedOutputSheetName
}

function toColumnLetter(columnNumber: number) {
  let current = columnNumber
  let result = ''

  while (current > 0) {
    const modulo = (current - 1) % 26
    result = String.fromCharCode(65 + modulo) + result
    current = Math.floor((current - modulo) / 26)
  }

  return result
}

async function ensureRequestSheetHeaders() {
  const sheetName = await getOutputSheetName()
  const lastColumn = toColumnLetter(REQUEST_HEADERS.length)
  await updateSheetRow(OUTPUT_SHEET_ID, `${sheetName}!A1:${lastColumn}1`, [REQUEST_HEADERS as unknown as string[]])
  return sheetName
}

function validateRequestPayload(payload: Partial<ChangeRequest>) {
  const requiredFields = ['operadorEmail', 'skuBase', 'tipoAlteracao', 'detalhe'] as const
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
    throw new Error('Informe um estoque geral valido para concluir a ativacao.')
  }

  return parsed
}

function serializeJson(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value) && value.length === 0) {
    return ''
  }

  return JSON.stringify(value)
}

function parseJsonArray<T>(value?: string) {
  if (!value) {
    return undefined
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : undefined
  } catch {
    return undefined
  }
}

function buildRequestRow(request: ChangeRequest) {
  return REQUEST_HEADERS.map((header) => {
    switch (header) {
      case 'variacoesSelecionadas':
        return serializeJson(request.variacoesSelecionadas)
      case 'estoquePorVariacao':
        return serializeJson(request.estoquePorVariacao)
      case 'estoqueGeral':
        return request.estoqueGeral === undefined ? '' : String(request.estoqueGeral)
      default:
        return String(request[header] ?? '')
    }
  })
}

function matchesFilters(request: ChangeRequest, filters: ChangeRequestFilters) {
  if (filters.status && request.status !== filters.status) {
    return false
  }

  if (filters.loja && normalizeText(request.loja) !== normalizeText(filters.loja)) {
    return false
  }

  if (filters.nome && !normalizeText(request.titulo).includes(normalizeText(filters.nome))) {
    return false
  }

  if (filters.sku) {
    const normalized = normalizeSku(filters.sku)
    const target = [request.skuBase, request.skuVariacao, ...(request.variacoesSelecionadas ?? [])].map((item) => normalizeSku(item))

    if (!target.some((item) => item.includes(normalized))) {
      return false
    }
  }

  return true
}

function resolveSelectedVariants(variants: CatalogVariant[], payload: Partial<ChangeRequest>, fallbackVariant?: CatalogVariant) {
  if (fallbackVariant) {
    return [fallbackVariant]
  }

  const requestedSkus = (payload.variacoesSelecionadas ?? []).map((sku) => normalizeSku(sku))

  if (requestedSkus.length === 0) {
    return []
  }

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
    return isVariantAction ? 'A variacao selecionada ja esta ativa.' : 'Nao existem variacoes inativas para ativar neste produto.'
  }

  if (tipoAlteracao === 'inativar_produto' || tipoAlteracao === 'inativar_variacao') {
    return isVariantAction ? 'A variacao selecionada ja esta inativa.' : 'Nao existem variacoes ativas para inativar neste produto.'
  }

  return 'Nenhuma variacao elegivel foi encontrada para esta acao.'
}

function buildStockByVariant(variants: CatalogVariant[], estoqueGeral?: number): RequestedVariantStock[] | undefined {
  if (estoqueGeral === undefined) {
    return undefined
  }

  return variants.map((variant) => ({
    sku: variant.sku,
    cor: variant.cor ?? variant.variacao,
    tamanho: variant.tamanho,
    estoque: estoqueGeral,
  }))
}

async function applySourceStatusUpdate(variants: CatalogVariant[], activeValue: 'SIM' | 'NAO') {
  if (!SOURCE_SHEET_ID) {
    throw new Error('GOOGLE_SOURCE_SHEET_ID nao configurado')
  }

  await updateRowsByLookup(
    SOURCE_SHEET_ID,
    SOURCE_VARIANT_SHEET,
    'sku',
    variants.map((variant) => ({
      key: variant.sku,
      values: {
        ativo: activeValue,
      },
    })),
  )

  await updateCatalogVariantStatuses(Object.fromEntries(variants.map((variant) => [variant.sku, activeValue === 'SIM'])))
}

async function createRequestInternal(
  payload: Partial<ChangeRequest>,
  options: { account?: UserAccount; loteId?: string } = {},
) {
  if (!OUTPUT_SHEET_ID) {
    throw new Error('GOOGLE_OUTPUT_SHEET_ID nao configurado')
  }

  validateRequestPayload(payload)

  const tipoAlteracao = payload.tipoAlteracao as ChangeRequest['tipoAlteracao']
  const account = options.account ?? (await validateActiveAccount(payload.operadorEmail as string))
  const snapshot = await getCatalogSnapshotItem({
    skuBase: payload.skuBase as string,
    skuVariacao: payload.skuVariacao,
    forceRefresh: true,
  })

  const selectedVariants = resolveSelectedVariants(snapshot.product.variacoes, payload, snapshot.variant)
  const scopedVariants = snapshot.variant ? [snapshot.variant] : selectedVariants.length > 0 ? selectedVariants : snapshot.product.variacoes
  const eligibleVariants = getEligibleVariants(scopedVariants, tipoAlteracao)
  const estoqueGeral =
    tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao'
      ? parseOptionalNumber(payload.estoqueGeral)
      : undefined

  if ((tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao') && estoqueGeral === undefined) {
    throw new Error('Preencha o estoque geral para concluir a ativacao.')
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

  const variacoesSelecionadas =
    tipoAlteracao === 'alteracao_especifica'
      ? scopedVariants.map((variant) => variant.sku)
      : eligibleVariants.map((variant) => variant.sku)

  const estoquePorVariacao = buildStockByVariant(eligibleVariants, estoqueGeral)
  const request: ChangeRequest = {
    id: createSimpleId('solicitacao'),
    loteId: options.loteId,
    dataAbertura: new Date().toISOString(),
    operadorEmail: account.email,
    operadorNome: account.nome,
    clienteCod: snapshot.product.clienteCod,
    loja: snapshot.product.loja,
    skuBase: snapshot.product.skuBase,
    skuVariacao: snapshot.variant?.sku ?? (variacoesSelecionadas.length === 1 ? variacoesSelecionadas[0] : payload.skuVariacao),
    titulo: snapshot.product.titulo,
    fotoRef: snapshot.product.fotoRef,
    tipoAlteracao,
    detalhe: compactText(payload.detalhe),
    status: 'nao_concluido',
    responsavelInterno: payload.responsavelInterno,
    dataConclusao: payload.dataConclusao,
    variacoesSelecionadas,
    estoqueGeral,
    estoquePorVariacao,
  }

  if (tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao') {
    await applySourceStatusUpdate(eligibleVariants, 'SIM')
  }

  if (tipoAlteracao === 'inativar_produto' || tipoAlteracao === 'inativar_variacao') {
    await applySourceStatusUpdate(eligibleVariants, 'NAO')
  }

  const sheetName = await ensureRequestSheetHeaders()

  try {
    await appendSheetRow(OUTPUT_SHEET_ID, sheetName, buildRequestRow(request))
  } catch (error) {
    if (
      tipoAlteracao === 'ativar_produto' ||
      tipoAlteracao === 'ativar_variacao' ||
      tipoAlteracao === 'inativar_produto' ||
      tipoAlteracao === 'inativar_variacao'
    ) {
      throw new Error(
        `A planilha principal foi atualizada, mas nao foi possivel registrar o historico: ${
          error instanceof Error ? error.message : 'falha desconhecida'
        }`,
      )
    }

    throw error
  }

  return request
}

export async function createRequest(payload: Partial<ChangeRequest>) {
  return createRequestInternal(payload)
}

export async function createBatchRequests(payload: BulkCreateRequestInput) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Selecione pelo menos um produto para enviar a acao em lote.')
  }

  const account = await validateActiveAccount(payload.operadorEmail)
  const loteId = createSimpleId('lote')
  const uniqueSkuBases = Array.from(new Set(payload.items.map((item) => normalizeSku(item.skuBase)).filter(Boolean)))
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

  return {
    loteId,
    created,
    errors,
  }
}

export async function listRequests(filters: ChangeRequestFilters = {}) {
  if (!OUTPUT_SHEET_ID) {
    throw new Error('GOOGLE_OUTPUT_SHEET_ID nao configurado')
  }

  const sheetName = await ensureRequestSheetHeaders()
  const rows = await readSheetTab(OUTPUT_SHEET_ID, sheetName)

  return rows
    .map<ChangeRequest>((row) => ({
      id: row.id ?? '',
      loteId: row.loteId ?? '',
      dataAbertura: row.dataAbertura ?? '',
      operadorEmail: row.operadorEmail ?? '',
      operadorNome: row.operadorNome ?? '',
      clienteCod: row.clienteCod ?? '',
      loja: row.loja ?? '',
      skuBase: row.skuBase ?? '',
      skuVariacao: row.skuVariacao ?? '',
      titulo: row.titulo ?? '',
      fotoRef: row.fotoRef ?? '',
      tipoAlteracao: (row.tipoAlteracao as ChangeRequest['tipoAlteracao']) ?? 'alteracao_especifica',
      detalhe: row.detalhe ?? '',
      status: (row.status as ChangeRequest['status']) ?? 'nao_concluido',
      responsavelInterno: row.responsavelInterno ?? '',
      dataConclusao: row.dataConclusao ?? '',
      variacoesSelecionadas: parseJsonArray<string>(row.variacoesSelecionadas),
      estoqueGeral: row.estoqueGeral ? Number(row.estoqueGeral) : undefined,
      estoquePorVariacao: parseJsonArray<RequestedVariantStock>(row.estoquePorVariacao),
    }))
    .filter((request) => request.id)
    .filter((request) => matchesFilters(request, filters))
    .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
}
