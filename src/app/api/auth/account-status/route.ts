import { NextResponse } from 'next/server'
import { getPublicAccountStatusByEmail } from '@/lib/services/account.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') ?? ''
    const data = await getPublicAccountStatusByEmail(email)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao verificar conta'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
