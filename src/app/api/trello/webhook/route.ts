import { NextRequest, NextResponse } from 'next/server'
import {
  verifyTrelloWebhookSignature,
  isCardMovedToCompleted,
  getCardIdFromAction,
  getBoardIdFromAction,
  type TrelloWebhookPayload,
} from '@/lib/services/trello.service'
import { createAdminClient } from '@/utils/supabase/admin'
import { getOptionalEnv } from '@/lib/env'
import { applyOperationalStatusChange } from '@/lib/services/request.service'

// ─── Config ───────────────────────────────────────────────────────────────────

const BOARD_NOVOS_PRODUTOS_ID = () => getOptionalEnv('TRELLO_BOARD_NOVOS_PRODUTOS_ID')
const BOARD_ATIVACAO_ID = () => getOptionalEnv('TRELLO_BOARD_ATIVACAO_ID')

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
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('solicitacoes_produto')
    .update({
      status: 'concluido',
      data_conclusao: now,
      atualizado_em: now,
    })
    .eq('trello_card_id', cardId)
    .select('id_solicitacao')

  if (error) {
    console.error('[trello/webhook] Erro ao atualizar solicitacao_produto:', error.message)
    return false
  }

  if (!data || data.length === 0) {
    return false
  }

  console.info('[trello/webhook] Novo produto concluido:', data[0].id_solicitacao)
  return true
}

// ─── Concluir solicitação operacional (Supabase) ─────────────────────────────

async function concludeOperationalRequest(cardId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Busca o registro pelo cardId para reaplicar o status no catálogo se necessário
  const { data: row, error: fetchError } = await supabase
    .from('solicitacoes_operacionais')
    .select('id, sku_base, tipo_alteracao, variacoes_selecionadas')
    .eq('trello_card_id', cardId)
    .maybeSingle()

  if (fetchError || !row) {
    return false
  }

  try {
    const tipoAlteracao = row.tipo_alteracao as string
    const skuBase = row.sku_base as string
    const variacoes: string[] = Array.isArray(row.variacoes_selecionadas) ? row.variacoes_selecionadas : []
    const isActivation = tipoAlteracao === 'ativar_produto' || tipoAlteracao === 'ativar_variacao'
    const isDeactivation = tipoAlteracao === 'inativar_produto' || tipoAlteracao === 'inativar_variacao'

    if ((isActivation || isDeactivation) && skuBase && variacoes.length > 0) {
      await applyOperationalStatusChange(skuBase, variacoes, isActivation)
    }

    await supabase
      .from('solicitacoes_operacionais')
      .update({ status: 'concluido', data_conclusao: now, atualizado_em: now })
      .eq('trello_card_id', cardId)

    console.info('[trello/webhook] Solicitacao operacional concluida, id:', row.id)
    return true
  } catch (err) {
    console.error('[trello/webhook] Erro em concludeOperationalRequest:', err instanceof Error ? err.message : err)
    return false
  }
}
