import { NextRequest, NextResponse } from 'next/server'
import {
  verifyTrelloWebhookSignature,
  isCardMovedToCompleted,
  getCardIdFromAction,
  getBoardIdFromAction,
  type TrelloWebhookPayload,
} from '@/lib/services/trello.service'
import { createAdminClient } from '@/utils/supabase/admin'
import { updateRowsByLookup } from '@/lib/google/sheets'
import { getOptionalEnv } from '@/lib/env'

// ─── Config ───────────────────────────────────────────────────────────────────

const BOARD_NOVOS_PRODUTOS_ID = () => getOptionalEnv('TRELLO_BOARD_NOVOS_PRODUTOS_ID')
const BOARD_ATIVACAO_ID = () => getOptionalEnv('TRELLO_BOARD_ATIVACAO_ID')
const OUTPUT_SHEET_ID = () => getOptionalEnv('GOOGLE_OUTPUT_SHEET_ID')
const OUTPUT_SHEET_NAME = () => getOptionalEnv('GOOGLE_OUTPUT_SHEET_NAME', 'Pagina1')

// ─── Trello exige HEAD/GET para registrar o webhook ──────────────────────────

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function GET() {
  return new NextResponse(null, { status: 200 })
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o body' }, { status: 400 })
  }

  // Verificação de assinatura HMAC-SHA1
  const signature = request.headers.get('x-trello-webhook') ?? ''
  const callbackUrl = `${request.nextUrl.origin}/api/trello/webhook`

  if (!verifyTrelloWebhookSignature(rawBody, signature, callbackUrl)) {
    return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 })
  }

  let payload: TrelloWebhookPayload

  try {
    payload = JSON.parse(rawBody) as TrelloWebhookPayload
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const { action } = payload

  // Só processa cards movidos para "Trabalho Concluído"
  if (!isCardMovedToCompleted(action)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const cardId = getCardIdFromAction(action)
  const boardId = getBoardIdFromAction(action)

  if (!cardId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    if (boardId === BOARD_NOVOS_PRODUTOS_ID()) {
      await concludeProductRequest(cardId)
    } else if (boardId === BOARD_ATIVACAO_ID()) {
      await concludeOperationalRequest(cardId)
    } else {
      // Board desconhecido — tenta os dois como fallback
      const found = await concludeProductRequest(cardId)
      if (!found) {
        await concludeOperationalRequest(cardId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('[trello/webhook] Erro ao concluir solicitacao:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Concluir solicitação de novo produto (Supabase) ──────────────────────────

async function concludeProductRequest(cardId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('solicitacoes_produto')
    .update({
      status: 'concluido',
      atualizado_em: new Date().toISOString(),
    })
    .eq('trello_card_id', cardId)
    .select('id_solicitacao')
    .single()

  if (error || !data) {
    return false
  }

  console.info('[trello/webhook] Novo produto concluido:', data.id_solicitacao)
  return true
}

// ─── Concluir solicitação operacional (Google Sheets) ────────────────────────

async function concludeOperationalRequest(cardId: string): Promise<boolean> {
  const sheetId = OUTPUT_SHEET_ID()
  const sheetName = OUTPUT_SHEET_NAME()

  if (!sheetId) {
    return false
  }

  try {
    await updateRowsByLookup(sheetId, sheetName, 'trelloCardId', [
      {
        key: cardId,
        values: {
          status: 'concluido',
          dataConclusao: new Date().toISOString(),
        },
      },
    ])

    console.info('[trello/webhook] Solicitacao operacional concluida, cardId:', cardId)
    return true
  } catch {
    return false
  }
}
