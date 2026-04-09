import { NextResponse } from 'next/server'
import { filterRequestsForAccount, getAuthenticatedAccount } from '@/lib/services/account.service'
import { createBatchRequests, createRequest, listRequests } from '@/lib/services/request.service'
import type { ChangeRequestStatus } from '@/types/request'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401 })
    }

    const data = await listRequests({
      status: (searchParams.get('status') as ChangeRequestStatus | null) ?? undefined,
      sku: searchParams.get('sku') ?? undefined,
      nome: searchParams.get('nome') ?? undefined,
      loja: searchParams.get('loja') ?? undefined,
    })

    return NextResponse.json({ data: filterRequestsForAccount(account, data) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao listar solicitacoes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401 })
    }

    const payload = await request.json()
    const scopedPayload = {
      ...payload,
      operadorEmail: account.email,
    }

    if (Array.isArray(scopedPayload.items)) {
      const data = await createBatchRequests(scopedPayload)
      const status = data.errors.length > 0 && data.created.length > 0 ? 207 : data.created.length > 0 ? 201 : 400
      return NextResponse.json({ data }, { status })
    }

    const data = await createRequest(scopedPayload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar solicitacao'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
