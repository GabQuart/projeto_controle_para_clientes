import { NextResponse } from 'next/server'
import { filterRequestsForAccount, validateActiveAccount } from '@/lib/services/account.service'
import { createBatchRequests, createRequest, listRequests } from '@/lib/services/request.service'
import type { ChangeRequestStatus } from '@/types/request'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') ?? undefined
    const account = email ? await validateActiveAccount(email) : null
    const data = await listRequests({
      status: (searchParams.get('status') as ChangeRequestStatus | null) ?? undefined,
      sku: searchParams.get('sku') ?? undefined,
      nome: searchParams.get('nome') ?? undefined,
      loja: searchParams.get('loja') ?? undefined,
    })

    return NextResponse.json({ data: account ? filterRequestsForAccount(account, data) : data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao listar solicitacoes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (Array.isArray(payload.items)) {
      const data = await createBatchRequests(payload)
      const status = data.errors.length > 0 && data.created.length > 0 ? 207 : data.created.length > 0 ? 201 : 400
      return NextResponse.json({ data }, { status })
    }

    const data = await createRequest(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar solicitacao'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
