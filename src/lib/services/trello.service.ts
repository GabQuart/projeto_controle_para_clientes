import { createHmac } from 'crypto'
import { getOptionalEnv } from '@/lib/env'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type TrelloAction = {
  type: string
  data: {
    card?: { id: string; name: string }
    listAfter?: { id: string; name: string }
    listBefore?: { id: string; name: string }
    board?: { id: string; name: string }
  }
}

export type TrelloWebhookPayload = {
  action: TrelloAction
  model?: { id: string; name: string }
}

export type TrelloLabel = {
  id: string
  name: string
  color: string | null
}

export type CreateTrelloCardInput = {
  listId: string
  name: string
  desc?: string
  urlSource?: string
  labelIds?: string[]
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TRELLO_API_BASE = 'https://api.trello.com/1'

function getTrelloCredentials() {
  return {
    key: getOptionalEnv('TRELLO_API_KEY'),
    token: getOptionalEnv('TRELLO_TOKEN'),
    appSecret: getOptionalEnv('TRELLO_APP_SECRET'),
  }
}

export function isTrelloConfigured() {
  const { key, token } = getTrelloCredentials()
  return Boolean(key && token)
}

// ─── Criar Card ───────────────────────────────────────────────────────────────

export async function createTrelloCard(input: CreateTrelloCardInput): Promise<string> {
  const { key, token } = getTrelloCredentials()

  if (!key || !token || !input.listId) {
    return ''
  }

  const params = new URLSearchParams({
    key,
    token,
    idList: input.listId,
    name: input.name,
    ...(input.desc ? { desc: input.desc } : {}),
    ...(input.urlSource ? { urlSource: input.urlSource } : {}),
    ...(input.labelIds?.length ? { idLabels: input.labelIds.join(',') } : {}),
  })

  const response = await fetch(`${TRELLO_API_BASE}/cards?${params}`, {
    method: 'POST',
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao criar card no Trello: ${response.status} - ${text.substring(0, 200)}`)
  }

  const data = await response.json() as { id: string }
  return data.id
}

// ─── Verificar Assinatura do Webhook ─────────────────────────────────────────

export function verifyTrelloWebhookSignature(
  rawBody: string,
  signature: string,
  callbackUrl: string,
): boolean {
  const { appSecret } = getTrelloCredentials()

  if (!appSecret) {
    // Se o secret não está configurado, não bloqueia (permite dev sem config)
    return true
  }

  try {
    const digest = createHmac('sha1', appSecret)
      .update(rawBody + callbackUrl)
      .digest('base64')

    return digest === signature
  } catch {
    return false
  }
}

// ─── Helpers de Payload ──────────────────────────────────────────────────────

export function isCardMovedToCompleted(action: TrelloAction): boolean {
  return (
    action.type === 'updateCard' &&
    Boolean(action.data.listAfter) &&
    action.data.listAfter!.name === 'Trabalho Concluído'
  )
}

export function getCardIdFromAction(action: TrelloAction): string {
  return action.data.card?.id ?? ''
}

export function getBoardIdFromAction(action: TrelloAction): string {
  return action.data.board?.id ?? ''
}

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export async function getTrelloBoardLabels(boardId: string): Promise<TrelloLabel[]> {
  const { key, token } = getTrelloCredentials()

  if (!key || !token || !boardId) {
    return []
  }

  const params = new URLSearchParams({ key, token })
  const response = await fetch(`${TRELLO_API_BASE}/boards/${boardId}/labels?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return []
  }

  return response.json() as Promise<TrelloLabel[]>
}

/**
 * Busca o ID de uma etiqueta pelo nome (case-insensitive).
 * Retorna string vazia se não encontrar.
 */
export async function findTrelloLabelId(boardId: string, labelName: string): Promise<string> {
  const labels = await getTrelloBoardLabels(boardId)
  const match = labels.find((l) => l.name.toLowerCase() === labelName.toLowerCase())
  return match?.id ?? ''
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export type TrelloWebhookInfo = {
  id: string
  description: string
  idModel: string
  callbackURL: string
  active: boolean
}

export async function registerTrelloWebhook(params: {
  callbackUrl: string
  boardId: string
  description?: string
}): Promise<TrelloWebhookInfo> {
  const { key, token } = getTrelloCredentials()

  if (!key || !token) {
    throw new Error('Trello não configurado: TRELLO_API_KEY e TRELLO_TOKEN são obrigatórios')
  }

  const body = new URLSearchParams({
    key,
    token,
    callbackURL: params.callbackUrl,
    idModel: params.boardId,
    description: params.description ?? 'Webhook Catalogo Marketplace',
  })

  const response = await fetch(`${TRELLO_API_BASE}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao registrar webhook: ${response.status} - ${text.substring(0, 300)}`)
  }

  return response.json() as Promise<TrelloWebhookInfo>
}

export async function listTrelloWebhooks(): Promise<TrelloWebhookInfo[]> {
  const { key, token } = getTrelloCredentials()

  if (!key || !token) {
    throw new Error('Trello não configurado')
  }

  const params = new URLSearchParams({ key, token })
  const response = await fetch(`${TRELLO_API_BASE}/tokens/${token}/webhooks?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao listar webhooks: ${response.status} - ${text.substring(0, 300)}`)
  }

  return response.json() as Promise<TrelloWebhookInfo[]>
}

export async function deleteTrelloWebhook(webhookId: string): Promise<void> {
  const { key, token } = getTrelloCredentials()

  if (!key || !token) {
    throw new Error('Trello não configurado')
  }

  const params = new URLSearchParams({ key, token })
  const response = await fetch(`${TRELLO_API_BASE}/webhooks/${webhookId}?${params}`, {
    method: 'DELETE',
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao deletar webhook: ${response.status} - ${text.substring(0, 300)}`)
  }
}

// ─── Formatadores de Card ────────────────────────────────────────────────────

function formatDateTime(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}`
}

export function buildProductRequestCardName(loja: string, nomeProduto: string): string {
  return `[${loja}] ${nomeProduto}`
}

export function buildProductRequestCardDesc(params: {
  solicitante: string
  tamanhos: string[]
  variationType: string
  variacoes: string[]
  custo: number
  observacoes?: string
  tabelaMedidas?: string
  dataPedido?: Date
}): string {
  const lines: string[] = []

  lines.push(`**Data do Pedido:** ${formatDateTime(params.dataPedido)}`)
  lines.push(`**Solicitante:** ${params.solicitante}`)
  lines.push(`**Custo:** R$ ${params.custo.toFixed(2)}`)
  lines.push(`**Tamanhos:** ${params.tamanhos.join(', ')}`)

  const tipoLabel =
    params.variationType === 'cores'
      ? 'Cores'
      : params.variationType === 'variados'
        ? 'Variados'
        : 'Estampas'

  lines.push(`**${tipoLabel}:** ${params.variacoes.join(', ')}`)

  if (params.tabelaMedidas) {
    const isTuOnly = params.tabelaMedidas.split('\n').every((l) => l.endsWith(': TU'))
    if (isTuOnly) {
      lines.push(`\n**Tabela de Medidas:** Tamanho Único`)
    } else {
      lines.push(`\n**Tabela de Medidas:**\n${params.tabelaMedidas}`)
    }
  }

  if (params.observacoes) {
    lines.push(`\n**Material/Obs:** ${params.observacoes}`)
  }

  return lines.join('\n')
}

export function buildOperationalCardName(
  tipoAlteracao: string,
  titulo: string,
  skuBase: string,
): string {
  const acao =
    tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao'
      ? 'ATIVAR'
      : 'INATIVAR'

  return `[${acao}] ${titulo} — ${skuBase}`
}

export function buildOperationalCardDesc(params: {
  loja: string
  operadorNome: string
  variacoes: string[]
  estoqueGeral?: number
  detalhe: string
  dataPedido?: Date
}): string {
  const lines: string[] = []

  lines.push(`**Data do Pedido:** ${formatDateTime(params.dataPedido)}`)
  lines.push(`**Loja:** ${params.loja}`)
  lines.push(`**Solicitante:** ${params.operadorNome}`)

  if (params.variacoes.length > 0) {
    lines.push(`**Variações:** ${params.variacoes.join(', ')}`)
  }

  if (params.estoqueGeral !== undefined) {
    lines.push(`**Quantidade:** ${params.estoqueGeral}`)
  }

  if (params.detalhe) {
    lines.push(`\n${params.detalhe}`)
  }

  return lines.join('\n')
}
