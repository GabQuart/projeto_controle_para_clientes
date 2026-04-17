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

export type CreateTrelloCardInput = {
  listId: string
  name: string
  desc?: string
  urlSource?: string
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

// ─── Formatadores de Card ────────────────────────────────────────────────────

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
}): string {
  const lines: string[] = []

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
}): string {
  const lines: string[] = []

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
