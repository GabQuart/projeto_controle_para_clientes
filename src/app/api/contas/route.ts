import { NextResponse } from 'next/server'
import { createAccount, getAccountByEmail, listAccountDirectory, listAccounts, validateActiveAccount } from '@/lib/services/account.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const includeDirectory = searchParams.get('includeDirectory') === '1'

    if (email) {
      const data = await getAccountByEmail(email)

      if (!data) {
        return NextResponse.json({ error: 'Conta nao encontrada' }, { status: 404 })
      }

      return NextResponse.json({ data })
    }

    const [accounts, directory] = await Promise.all([
      listAccounts(),
      includeDirectory ? listAccountDirectory() : Promise.resolve(undefined),
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
    const createdByEmail = String(payload.createdByEmail ?? '')
    const actor = await validateActiveAccount(createdByEmail)

    if (actor.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas contas admin podem criar novos acessos.' }, { status: 403 })
    }

    const data = await createAccount(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar conta'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
