import {
  convertGoogleDriveLinkToUsableUrl,
  resolveReferenceImageGallery,
  resolveDriveRequestFolderImage,
  uploadFilesToDriveRequestFolder,
} from '@/lib/google/drive'
import { listAccountDirectory } from '@/lib/services/account.service'
import {
  isTrelloConfigured,
  createTrelloCard,
  buildProductRequestCardName,
  buildProductRequestCardDesc,
} from '@/lib/services/trello.service'
import { getOptionalEnv } from '@/lib/env'
import { compactText, normalizeText } from '@/lib/utils/format'
import { createSimpleId } from '@/lib/utils/id'
import type { UserAccount } from '@/types/account'
import type {
  ProductRequestOptions,
  ProductRequestRecord,
  ProductRequestSizeGroup,
  ProductRequestSizeMeasureEntry,
  ProductRequestSizeOption,
  ProductRequestVariationType,
} from '@/types/product-request'
import type { ChangeRequestFilters, RequestHistoryEntry, RequestHistoryStatus } from '@/types/request'
import { createAdminClient } from '@/utils/supabase/admin'

const PRODUCT_REQUESTS_SHEET_ID = process.env.GOOGLE_PRODUCT_REQUESTS_SHEET_ID ?? ''
const PRODUCT_REQUESTS_UPLOAD_FOLDER_ID =
  process.env.GOOGLE_PRODUCT_REQUESTS_UPLOAD_FOLDER_ID ?? process.env.GOOGLE_DRIVE_FOLDER_ID ?? ''
const PRODUCT_REQUESTS_DRIVE_ROOT = process.env.GOOGLE_PRODUCT_REQUESTS_DRIVE_ROOT_NAME ?? 'solicitacoes_produto'
const PRODUCT_REQUEST_STATUS: RequestHistoryStatus = 'pendente'
const PRODUCT_REQUEST_TYPE = 'novo_produto'

type DictionaryColorRow = {
  cor_nome?: string
}

type DictionarySizeRow = {
  tamanho_cod?: string
  tamanho_nome?: string
  categoria?: string
}

type ProductRequestSheetRow = {
  id_solicitacao?: string
  data_criacao?: string
  cliente?: string
  nome_produto?: string
  custo_produto?: string
  solicitante?: string
  tamanhos?: string
  tabela_medidas?: string
  tipo_variacao?: string
  variacoes?: string
  qtd_imagens?: string
  link_pasta_drive?: string
  links_imagens?: string
  status?: string
  origem?: string
  observacoes?: string
  tipo_solicitacao?: string
}

type ProductRequestImageUpload = {
  fileName: string
  mimeType: string
  base64Content: string
}

type CreateProductRequestInput = {
  account: UserAccount
  store: string
  productName: string
  productCost: number
  sizes: string[]
  sizeChartEntries: ProductRequestSizeMeasureEntry[]
  variationType: ProductRequestVariationType
  variations: string[]
  notes?: string
  images: ProductRequestImageUpload[]
}

let cachedRequestOptions: Pick<ProductRequestOptions, 'colors' | 'sizeGroups'> | null = null
const requestImageCache = new Map<string, string>()

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => compactText(value)).filter(Boolean)))
}

function mapProductRequestInfrastructureError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Falha na infraestrutura da solicitacao.'

  if (message.includes('DriveApp.Folder.createFolder') || message.includes('Permiss')) {
    return 'Falha ao criar a pasta no Drive. Reautorize o Apps Script com permissao de Drive e publique novamente o Web App.'
  }

  return message
}

function normalizeCategory(value?: string | null) {
  return compactText(value ?? '').toLowerCase()
}

function getSizeGroupId(size: ProductRequestSizeOption): ProductRequestSizeGroup['id'] {
  const normalizedCategory = normalizeCategory(size.category)
  const isNumericCode = /^\d+$/.test(size.code)

  if (isNumericCode || normalizedCategory.includes('juvenil') || normalizedCategory.includes('calc')) {
    return 'sapato'
  }

  if (normalizedCategory.includes('infantil')) {
    return 'infantil'
  }

  return 'adulto'
}

function getSizeGroupLabel(groupId: ProductRequestSizeGroup['id']) {
  if (groupId === 'sapato') {
    return 'Calcado'
  }

  if (groupId === 'infantil') {
    return 'Infantil Bebe'
  }

  return 'Adulto e Plus size'
}

const APPAREL_SIZE_ORDER = [
  'RN',
  'BB',
  'PPP',
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'XGG',
  'XXG',
  'EXG',
  'EG',
  'G1',
  'G2',
  'G3',
  'G4',
  'UN',
  'U',
  'UNICO',
] as const

function normalizeSizeToken(value: string) {
  return normalizeText(value).replace(/\s+/g, '').toUpperCase()
}

function parseSizeNumber(value: string) {
  const match = normalizeSizeToken(value).match(/^(\d+)/)
  return match ? Number(match[1]) : Number.NaN
}

function getApparelSizeRank(value: string) {
  const normalized = normalizeSizeToken(value)
  const rank = APPAREL_SIZE_ORDER.indexOf(normalized as (typeof APPAREL_SIZE_ORDER)[number])
  return rank >= 0 ? rank : Number.POSITIVE_INFINITY
}

function sortSizeOptions(items: ProductRequestSizeOption[]) {
  return [...items].sort((left, right) => {
    const leftNumeric = Number(left.code)
    const rightNumeric = Number(right.code)
    const bothNumeric = Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)

    if (bothNumeric) {
      return leftNumeric - rightNumeric
    }

    const leftNumberInCode = parseSizeNumber(left.code || left.label)
    const rightNumberInCode = parseSizeNumber(right.code || right.label)
    const bothStartWithNumber = Number.isFinite(leftNumberInCode) && Number.isFinite(rightNumberInCode)

    if (bothStartWithNumber) {
      if (leftNumberInCode !== rightNumberInCode) {
        return leftNumberInCode - rightNumberInCode
      }

      return left.label.localeCompare(right.label, 'pt-BR')
    }

    const leftRank = getApparelSizeRank(left.code || left.label)
    const rightRank = getApparelSizeRank(right.code || right.label)

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    return left.label.localeCompare(right.label, 'pt-BR')
  })
}

async function readDictionaryOptions() {
  if (cachedRequestOptions) {
    return cachedRequestOptions
  }

  const supabase = createAdminClient()

  const [{ data: colorRows }, { data: sizeRows }] = await Promise.all([
    supabase.from('dic_cores').select('cor_nome').order('cor_nome'),
    supabase.from('dic_tamanhos').select('tamanho_cod, tamanho_nome, categoria'),
  ])

  const colors = unique((colorRows ?? []).map((row) => (row as { cor_nome: string }).cor_nome ?? '')).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )

  const sizeOptions = (sizeRows ?? [])
    .map<ProductRequestSizeOption | null>((row) => {
      const r = row as DictionarySizeRow
      const code = compactText(r.tamanho_cod ?? '')
      const label = compactText(r.tamanho_nome ?? '') || code
      const category = compactText(r.categoria ?? '')

      if (!code || !label) {
        return null
      }

      return {
        code,
        label,
        category,
      }
    })
    .filter((row): row is ProductRequestSizeOption => Boolean(row))

  const groupedMap = new Map<ProductRequestSizeGroup['id'], ProductRequestSizeOption[]>()

  sizeOptions.forEach((size) => {
    const groupId = getSizeGroupId(size)
    const currentGroup = groupedMap.get(groupId) ?? []
    currentGroup.push(size)
    groupedMap.set(groupId, currentGroup)
  })

  const sizeGroups: ProductRequestSizeGroup[] = (['adulto', 'infantil', 'sapato'] as const)
    .map((groupId) => ({
      id: groupId,
      label: getSizeGroupLabel(groupId),
      items: sortSizeOptions(groupedMap.get(groupId) ?? []),
    }))
    .filter((group) => group.items.length > 0)

  cachedRequestOptions = {
    colors,
    sizeGroups,
  }

  return cachedRequestOptions
}

function ensurePositiveNumber(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Informe um custo valido para o produto.')
  }

  return Number(value)
}

function validateVariationValues(values: string[], type: ProductRequestVariationType) {
  const cleanedValues = unique(values)

  if (cleanedValues.length === 0) {
    if (type === 'cores') {
      throw new Error('Selecione ao menos uma cor.')
    }

    if (type === 'variados') {
      throw new Error('Informe ao menos uma variacao em Variados.')
    }

    throw new Error('Informe ao menos uma variacao de estampa.')
  }

  return cleanedValues
}

function validateStore(inputStore: string, account: UserAccount) {
  const store = compactText(inputStore)

  if (!store) {
    throw new Error('Selecione a loja da solicitacao.')
  }

  if (account.role === 'admin') {
    return store
  }

  if (!account.access.lojas.includes(store)) {
    throw new Error('A loja selecionada nao pertence a esta conta.')
  }

  return store
}

function validateImages(images: ProductRequestImageUpload[]) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Adicione pelo menos uma imagem do produto.')
  }

  return images
}

function normalizeSizeChartEntries(sizes: string[], entries: ProductRequestSizeMeasureEntry[]) {
  const selectedSizes = unique(sizes)
  const normalizedEntries = entries
    .map((entry) => ({
      size: compactText(entry.size),
      measurement: compactText(entry.measurement),
    }))
    .filter((entry) => entry.size && entry.measurement)

  const entryMap = new Map<string, string[]>()

  normalizedEntries.forEach((entry) => {
    const current = entryMap.get(entry.size) ?? []
    current.push(entry.measurement)
    entryMap.set(entry.size, current)
  })

  // Tamanhos sem medidas recebem "TU" (Tamanho Único) como fallback
  return selectedSizes.flatMap((size) => {
    const measurements = entryMap.get(size) ?? []
    return measurements.length > 0
      ? measurements.map((measurement) => ({ size, measurement }))
      : [{ size, measurement: 'TU' }]
  })
}

function serializeSizeChart(entries: ProductRequestSizeMeasureEntry[]) {
  const groupedEntries = new Map<string, string[]>()

  entries.forEach((entry) => {
    const current = groupedEntries.get(entry.size) ?? []
    current.push(entry.measurement)
    groupedEntries.set(entry.size, current)
  })

  return Array.from(groupedEntries.entries())
    .map(([size, measurements]) => `${size}: ${measurements.join(' | ')}`)
    .join('\n')
}

function splitPipeList(value?: string) {
  return unique(String(value ?? '').split('|').map((item) => item.trim()))
}

function splitLines(value?: string) {
  return unique(String(value ?? '').split(/\r?\n/).map((item) => item.trim()))
}

function parseRequesterInfo(value?: string) {
  const [namePart, emailPart] = String(value ?? '').split('|').map((item) => compactText(item))
  return {
    nome: namePart || 'Solicitante',
    email: emailPart || '',
  }
}

function normalizeHistoryStatus(value?: string | null): RequestHistoryStatus {
  const normalized = normalizeText(value ?? '')

  if (normalized === 'pendente' || normalized === 'novo') {
    return 'pendente'
  }

  if (normalized === 'em_andamento') {
    return 'em_andamento'
  }

  if (normalized === 'concluido') {
    return 'concluido'
  }

  if (normalized === 'cancelado') {
    return 'cancelado'
  }

  return 'nao_concluido'
}

function matchesProductRequestSheetFilters(row: ProductRequestSheetRow, filters: ChangeRequestFilters) {
  if (filters.tipoSolicitacao && filters.tipoSolicitacao !== PRODUCT_REQUEST_TYPE) {
    return false
  }

  if (filters.status && normalizeHistoryStatus(row.status) !== filters.status) {
    return false
  }

  const rowStore = compactText(row.cliente ?? '')
  if (filters.loja && normalizeText(rowStore) !== normalizeText(filters.loja)) {
    return false
  }

  const rowTitle = compactText(row.nome_produto ?? '')
  if (filters.nome && !normalizeText(rowTitle).includes(normalizeText(filters.nome))) {
    return false
  }

  if (filters.sku && !normalizeText(row.id_solicitacao ?? '').includes(normalizeText(filters.sku))) {
    return false
  }

  return true
}

function buildProductRequestDetail(row: ProductRequestSheetRow) {
  const sizeSummary = splitPipeList(row.tamanhos).join(', ')
  const variationType = compactText(row.tipo_variacao ?? '')
  const variations = splitPipeList(row.variacoes)
  const notes = compactText(row.observacoes ?? '')
  const parts = [] as string[]

  if (sizeSummary) {
    parts.push(`Tamanhos: ${sizeSummary}`)
  }

  if (variationType && variations.length > 0) {
    const variationLabel =
      variationType === 'cores'
        ? 'Cores'
        : variationType === 'variados'
          ? 'Variados'
          : 'Estampas'
    parts.push(`${variationLabel}: ${variations.join(', ')}`)
  }

  if (notes) {
    parts.push(`Material: ${notes}`)
  }

  return parts.join(' | ') || 'Solicitacao de novo produto registrada.'
}

async function resolveProductRequestImage(row: ProductRequestSheetRow) {
  const requestId = compactText(row.id_solicitacao ?? '')

  if (!requestId) {
    return ''
  }

  const cachedValue = requestImageCache.get(requestId)
  if (cachedValue !== undefined) {
    return cachedValue
  }

  const imageLinks = splitLines(row.links_imagens)
  const inlineImage = imageLinks.map((value) => convertGoogleDriveLinkToUsableUrl(value)).find(Boolean)

  if (inlineImage) {
    requestImageCache.set(requestId, inlineImage)
    return inlineImage
  }

  const folderUrl = compactText(row.link_pasta_drive ?? '')

  if (folderUrl) {
    try {
      const gallery = await resolveReferenceImageGallery(folderUrl, { limit: 1 })
      const galleryImage = gallery.images[0]?.usableUrl ?? gallery.images[0]?.originalUrl ?? ''

      if (galleryImage) {
        requestImageCache.set(requestId, galleryImage)
        return galleryImage
      }
    } catch {
      // fallback below
    }
  }

  if (PRODUCT_REQUESTS_UPLOAD_FOLDER_ID) {
    try {
      const resolved = await resolveDriveRequestFolderImage({
        parentFolderId: PRODUCT_REQUESTS_UPLOAD_FOLDER_ID,
        requestId,
        rootFolderName: PRODUCT_REQUESTS_DRIVE_ROOT,
      })

      const driveImage = resolved.image?.usableUrl ?? resolved.image?.originalUrl ?? ''

      if (driveImage) {
        requestImageCache.set(requestId, driveImage)
        return driveImage
      }
    } catch {
      // silent fallback
    }
  }

  requestImageCache.set(requestId, '')
  return ''
}

async function mapProductRequestRowToHistory(row: ProductRequestSheetRow): Promise<RequestHistoryEntry | null> {
  const id = compactText(row.id_solicitacao ?? '')

  if (!id) {
    return null
  }

  const requester = parseRequesterInfo(row.solicitante ?? (row as Record<string, string | undefined>)['Coluna 6'])
  const image = await resolveProductRequestImage(row)
  const imageCount = Number(row.qtd_imagens ?? 0)

  return {
    id,
    dataAbertura: row.data_criacao ?? '',
    operadorEmail: requester.email,
    operadorNome: requester.nome,
    clienteCod: compactText(row.cliente ?? ''),
    loja: compactText(row.cliente ?? ''),
    skuBase: '',
    titulo: compactText(row.nome_produto ?? '') || 'Novo produto',
    fotoRef: image,
    detalhe: buildProductRequestDetail(row),
    status: normalizeHistoryStatus(row.status),
    tipoSolicitacao: PRODUCT_REQUEST_TYPE,
    requestLabel: 'Novo produto',
    folderUrl: compactText(row.link_pasta_drive ?? ''),
    imageCount: Number.isFinite(imageCount) ? imageCount : undefined,
  }
}

export async function getProductRequestOptions(account: UserAccount): Promise<ProductRequestOptions> {
  const dictionaryOptions = await readDictionaryOptions()
  let stores = account.access.lojas

  if (account.role === 'admin') {
    const directory = await listAccountDirectory()
    stores = unique(directory.map((entry) => entry.loja))
  }

  return {
    sizeGroups: dictionaryOptions.sizeGroups,
    colors: dictionaryOptions.colors,
    stores,
    defaultStore: stores[0],
  }
}

export async function createProductRequest(input: CreateProductRequestInput) {
  if (!PRODUCT_REQUESTS_SHEET_ID) {
    throw new Error('GOOGLE_PRODUCT_REQUESTS_SHEET_ID nao configurado.')
  }

  if (!PRODUCT_REQUESTS_UPLOAD_FOLDER_ID) {
    throw new Error('GOOGLE_PRODUCT_REQUESTS_UPLOAD_FOLDER_ID nao configurado.')
  }

  const store = validateStore(input.store, input.account)
  const productName = compactText(input.productName)
  const notes = compactText(input.notes ?? '')
  const sizes = unique(input.sizes)
  const sizeChartEntries = normalizeSizeChartEntries(sizes, input.sizeChartEntries)
  const sizeChart = serializeSizeChart(sizeChartEntries)
  const variationType = input.variationType
  const variations = validateVariationValues(input.variations, variationType)
  const images = validateImages(input.images)
  const productCost = ensurePositiveNumber(input.productCost)

  if (!productName) {
    throw new Error('Informe o nome do produto.')
  }

  if (sizes.length === 0) {
    throw new Error('Selecione ao menos um tamanho.')
  }

  const id = createSimpleId('sol_produto')
  const createdAt = new Date().toISOString()
  let folderPayload

  try {
    folderPayload = await uploadFilesToDriveRequestFolder({
      parentFolderId: PRODUCT_REQUESTS_UPLOAD_FOLDER_ID,
      requestId: id,
      rootFolderName: PRODUCT_REQUESTS_DRIVE_ROOT,
      files: images,
    })
  } catch (error) {
    throw new Error(mapProductRequestInfrastructureError(error))
  }

  const record: ProductRequestRecord = {
    id,
    createdAt,
    cliente: store,
    requesterName: input.account.nome,
    requesterEmail: input.account.email,
    productName,
    productCost,
    sizes,
    sizeChart,
    variationType,
    variations,
    imageCount: folderPayload.files.length,
    folderUrl: folderPayload.folderUrl,
    imageLinks: folderPayload.files,
    status: PRODUCT_REQUEST_STATUS,
    origin: 'sistema_web',
    notes,
  }

  // ── 1. Salva no Supabase ──────────────────────────────────────────────────
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from('solicitacoes_produto').insert({
    id_solicitacao: record.id,
    data_criacao: record.createdAt,
    loja: record.cliente,
    cliente_cod: record.cliente,
    nome_produto: record.productName,
    custo_produto: record.productCost,
    solicitante: `${record.requesterName} | ${record.requesterEmail}`,
    tamanhos_raw: record.sizes.join(' | '),
    tamanhos: record.sizes,
    tabela_medidas: record.sizeChart,
    tipo_variacao: record.variationType,
    variacoes_raw: record.variations.join(' | '),
    variacoes: record.variations,
    qtd_imagens: record.imageCount,
    link_pasta_drive: record.folderUrl,
    links_imagens: folderPayload.files.map((f) => f.originalUrl),
    status: 'pendente',
    origem: 'sistema_web',
    observacoes: record.notes ?? '',
    tipo_solicitacao: PRODUCT_REQUEST_TYPE,
    enviado_trello: false,
  })

  if (dbError) {
    throw new Error(`Falha ao registrar solicitacao: ${dbError.message}`)
  }

  // ── 2. Cria card no Trello (se configurado) ───────────────────────────────
  const trelloListId = getOptionalEnv('TRELLO_LIST_NOVOS_PRODUTOS_ENTRADA_ID')

  if (isTrelloConfigured() && trelloListId) {
    try {
      const cardName = buildProductRequestCardName(record.cliente, record.productName)
      const cardDesc = buildProductRequestCardDesc({
        solicitante: record.requesterName,
        tamanhos: record.sizes,
        variationType: record.variationType,
        variacoes: record.variations,
        custo: record.productCost,
        observacoes: record.notes,
        tabelaMedidas: record.sizeChart,
        dataPedido: new Date(record.createdAt),
      })

      const cardId = await createTrelloCard({
        listId: trelloListId,
        name: cardName,
        desc: cardDesc,
        urlSource: record.folderUrl || undefined,
      })

      if (cardId) {
        await supabase
          .from('solicitacoes_produto')
          .update({ enviado_trello: true, trello_card_id: cardId, trello_enviado_em: new Date().toISOString() })
          .eq('id_solicitacao', record.id)
      }
    } catch (trelloError) {
      // Não bloqueia a solicitação se o Trello falhar
      console.warn('[product-request] Falha ao criar card no Trello:', trelloError instanceof Error ? trelloError.message : trelloError)
    }
  }

  return record
}

export async function listProductRequestHistory(filters: ChangeRequestFilters = {}) {
  const supabase = createAdminClient()

  let query = supabase
    .from('solicitacoes_produto')
    .select('*')
    .order('criado_em', { ascending: false })

  if (filters.tipoSolicitacao && filters.tipoSolicitacao !== PRODUCT_REQUEST_TYPE) {
    return [] as RequestHistoryEntry[]
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.loja) {
    query = query.eq('loja', filters.loja)
  }

  if (filters.nome) {
    query = query.ilike('nome_produto', `%${filters.nome}%`)
  }

  if (filters.sku) {
    query = query.ilike('id_solicitacao', `%${filters.sku}%`)
  }

  const { data: rows } = await query

  const mappedRows = await Promise.all(
    (rows ?? []).map((row) =>
      mapProductRequestRowToHistory({
        id_solicitacao: row.id_solicitacao,
        data_criacao: row.data_criacao,
        cliente: row.loja,
        nome_produto: row.nome_produto,
        custo_produto: String(row.custo_produto ?? ''),
        solicitante: row.solicitante,
        tamanhos: row.tamanhos_raw,
        tabela_medidas: row.tabela_medidas,
        tipo_variacao: row.tipo_variacao,
        variacoes: row.variacoes_raw,
        qtd_imagens: String(row.qtd_imagens ?? ''),
        link_pasta_drive: row.link_pasta_drive,
        links_imagens: (row.links_imagens ?? []).join('\n'),
        status: row.status,
        origem: row.origem,
        observacoes: row.observacoes,
        tipo_solicitacao: row.tipo_solicitacao,
      }),
    ),
  )

  return mappedRows.filter((row): row is RequestHistoryEntry => Boolean(row?.id))
}
