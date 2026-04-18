import { NextRequest, NextResponse } from 'next/server'
import {
  isTrelloConfigured,
  registerTrelloWebhook,
  listTrelloWebhooks,
  deleteTrelloWebhook,
  type TrelloWebhookInfo,
} from '@/lib/services/trello.service'
import { getOptionalEnv } from '@/lib/env'

// ─── Config ───────────────────────────────────────────────────────────────────

function getBoardIds() {
  return {
    ativacao: getOptionalEnv('TRELLO_BOARD_ATIVACAO_ID'),
    novosProdutos: getOptionalEnv('TRELLO_BOARD_NOVOS_PRODUTOS_ID'),
  }
}

// ─── URL da Edge Function (sempre pública, independe do deploy do Next.js) ────

function getEdgeFunctionCallbackUrl() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  return `${supabaseUrl}/functions/v1/trello-webhook`
}

// ─── GET — lista webhooks e status da configuração ────────────────────────────

export async function GET(_request: NextRequest) {
  if (!isTrelloConfigured()) {
    return NextResponse.json(
      { error: 'Trello não configurado. Verifique TRELLO_API_KEY e TRELLO_TOKEN.' },
      { status: 503 },
    )
  }

  try {
    const webhooks = await listTrelloWebhooks()
    const boards = getBoardIds()
    const callbackUrl = getEdgeFunctionCallbackUrl()

    const status = {
      configured: true,
      callbackUrl,
      boards: {
        ativacao: {
          boardId: boards.ativacao || null,
          webhookRegistrado: webhooks.some(
            (w) => w.idModel === boards.ativacao && w.callbackURL === callbackUrl,
          ),
        },
        novosProdutos: {
          boardId: boards.novosProdutos || null,
          webhookRegistrado: webhooks.some(
            (w) => w.idModel === boards.novosProdutos && w.callbackURL === callbackUrl,
          ),
        },
      },
      webhooks: webhooks.map((w: TrelloWebhookInfo) => ({
        id: w.id,
        description: w.description,
        idModel: w.idModel,
        callbackURL: w.callbackURL,
        active: w.active,
      })),
    }

    return NextResponse.json(status)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST — registra webhooks para os quadros configurados ────────────────────

export async function POST(_request: NextRequest) {
  if (!isTrelloConfigured()) {
    return NextResponse.json(
      { error: 'Trello não configurado. Verifique TRELLO_API_KEY e TRELLO_TOKEN.' },
      { status: 503 },
    )
  }

  const boards = getBoardIds()
  const callbackUrl = getEdgeFunctionCallbackUrl()

  const results: {
    board: string
    boardId: string
    status: 'registrado' | 'ja_existe' | 'erro' | 'sem_board_id'
    webhookId?: string
    error?: string
  }[] = []

  // Busca webhooks existentes para evitar duplicatas
  let existingWebhooks: TrelloWebhookInfo[] = []
  try {
    existingWebhooks = await listTrelloWebhooks()
  } catch {
    // Ignora erro ao listar — tenta registrar mesmo assim
  }

  const boardEntries: Array<{ key: string; boardId: string; description: string }> = [
    {
      key: 'ativacao',
      boardId: boards.ativacao,
      description: 'Webhook — Controle de ativação e inativação',
    },
    {
      key: 'novosProdutos',
      boardId: boards.novosProdutos,
      description: 'Webhook — Novos Produtos',
    },
  ]

  for (const entry of boardEntries) {
    if (!entry.boardId) {
      results.push({ board: entry.key, boardId: '', status: 'sem_board_id' })
      continue
    }

    const alreadyRegistered = existingWebhooks.find(
      (w) => w.idModel === entry.boardId && w.callbackURL === callbackUrl,
    )

    if (alreadyRegistered) {
      results.push({
        board: entry.key,
        boardId: entry.boardId,
        status: 'ja_existe',
        webhookId: alreadyRegistered.id,
      })
      continue
    }

    try {
      const webhook = await registerTrelloWebhook({
        callbackUrl,
        boardId: entry.boardId,
        description: entry.description,
      })
      results.push({ board: entry.key, boardId: entry.boardId, status: 'registrado', webhookId: webhook.id })
    } catch (error) {
      results.push({
        board: entry.key,
        boardId: entry.boardId,
        status: 'erro',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  const hasErrors = results.some((r) => r.status === 'erro')
  return NextResponse.json({ callbackUrl, results }, { status: hasErrors ? 207 : 200 })
}

// ─── DELETE — remove um webhook pelo ID ──────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!isTrelloConfigured()) {
    return NextResponse.json(
      { error: 'Trello não configurado.' },
      { status: 503 },
    )
  }

  const { searchParams } = request.nextUrl
  const webhookId = searchParams.get('id')

  if (!webhookId) {
    return NextResponse.json({ error: 'Parâmetro "id" é obrigatório.' }, { status: 400 })
  }

  try {
    await deleteTrelloWebhook(webhookId)
    return NextResponse.json({ ok: true, deletado: webhookId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
