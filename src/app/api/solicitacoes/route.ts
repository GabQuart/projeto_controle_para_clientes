import { NextResponse } from 'next/server'
import { createRequest, listRequests } from '@/lib/services/request.service'
import type { ChangeRequestStatus } from '@/types/request'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = await listRequests({
      status: (searchParams.get('status') as ChangeRequestStatus | null) ?? undefined,
      sku: searchParams.get('sku') ?? undefined,
      nome: searchParams.get('nome') ?? undefined,
      loja: searchParams.get('loja') ?? undefined,
    })

    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao listar solicitacoes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const data = await createRequest(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar solicitacao'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
