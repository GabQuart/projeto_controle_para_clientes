import { NextResponse } from 'next/server'
import { createAccount, getAuthenticatedAccount, listAccountDirectory, listAccounts, requireAdminAccount } from '@/lib/services/account.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDirectory = searchParams.get('includeDirectory') === '1'
    const refreshDirectory = searchParams.get('refreshDirectory') === '1'
    const actor = await getAuthenticatedAccount()

    if (!actor) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401 })
    }

    if (actor.role !== 'admin') {
      return NextResponse.json({ data: actor, directory: [] })
    }

    const [accounts, directory] = await Promise.all([
      listAccounts(),
      includeDirectory ? listAccountDirectory({ refresh: refreshDirectory }) : Promise.resolve(undefined),
    ])

    return NextResponse.json({
      data: accounts,
      directory,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar contas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    await requireAdminAccount()

    const data = await createAccount(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar conta'
    const status = message.includes('administradores') || message.includes('Sessao autenticada') ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
