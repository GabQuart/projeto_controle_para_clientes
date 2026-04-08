import { appendSheetRow, getSpreadsheetSheetTitles, readSheetTab, updateSheetRow } from '@/lib/google/sheets'
import { compactText, normalizeText } from '@/lib/utils/format'
import { createSimpleId } from '@/lib/utils/id'
import { normalizeSku } from '@/lib/utils/sku'
import { getCatalogSnapshotItem } from '@/lib/services/catalog.service'
import { validateActiveOperator } from '@/lib/services/operator.service'
import type { ChangeRequest, ChangeRequestFilters } from '@/types/request'

const OUTPUT_SHEET_ID = process.env.GOOGLE_OUTPUT_SHEET_ID ?? ''
const REQUEST_HEADERS = [
  'id',
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
]

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
  cachedOutputSheetName = titles[0] ?? 'Página1'
  return cachedOutputSheetName
}

async function ensureRequestSheetHeaders() {
  const sheetName = await getOutputSheetName()
  await updateSheetRow(OUTPUT_SHEET_ID, `${sheetName}!A1:O1`, [REQUEST_HEADERS])
  return sheetName
}

function validateRequestPayload(payload: Partial<ChangeRequest>) {
  const requiredFields = [
    'operadorEmail',
    'clienteCod',
    'loja',
    'skuBase',
    'titulo',
    'tipoAlteracao',
    'detalhe',
  ] as const

  const missing = requiredFields.filter((field) => !compactText(payload[field]))

  if (missing.length > 0) {
    throw new Error(`Campos obrigatorios ausentes: ${missing.join(', ')}`)
  }
}

function buildRequestRow(request: ChangeRequest) {
  return REQUEST_HEADERS.map((header) => String(request[header as keyof ChangeRequest] ?? ''))
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
    const target = [request.skuBase, request.skuVariacao].map((item) => normalizeSku(item))
    if (!target.some((item) => item.includes(normalized))) {
      return false
    }
  }

  return true
}

export async function createRequest(payload: Partial<ChangeRequest>) {
  if (!OUTPUT_SHEET_ID) {
    throw new Error('GOOGLE_OUTPUT_SHEET_ID nao configurado')
  }

  validateRequestPayload(payload)
  const operator = await validateActiveOperator(payload.operadorEmail as string)
  const snapshot = await getCatalogSnapshotItem({
    skuBase: payload.skuBase as string,
    skuVariacao: payload.skuVariacao,
  })

  const request: ChangeRequest = {
    id: createSimpleId('solicitacao'),
    dataAbertura: new Date().toISOString(),
    operadorEmail: operator.email,
    operadorNome: operator.nome,
    clienteCod: snapshot.product.clienteCod,
    loja: snapshot.product.loja,
    skuBase: snapshot.product.skuBase,
    skuVariacao: snapshot.variant?.sku ?? payload.skuVariacao,
    titulo: snapshot.product.titulo,
    fotoRef: snapshot.product.fotoRef,
    tipoAlteracao: payload.tipoAlteracao as ChangeRequest['tipoAlteracao'],
    detalhe: compactText(payload.detalhe),
    status: 'nao_concluido',
    responsavelInterno: payload.responsavelInterno,
    dataConclusao: payload.dataConclusao,
  }

  const sheetName = await ensureRequestSheetHeaders()
  await appendSheetRow(OUTPUT_SHEET_ID, sheetName, buildRequestRow(request))

  return request
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
    }))
    .filter((request) => request.id)
    .filter((request) => matchesFilters(request, filters))
    .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
}
