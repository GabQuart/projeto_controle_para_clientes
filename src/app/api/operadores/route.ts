import { NextResponse } from 'next/server'
import { listOperators } from '@/lib/services/operator.service'

export async function GET() {
  try {
    const data = await listOperators()
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao listar operadores'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
