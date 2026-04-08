import { NextResponse } from 'next/server'
import { listCatalog } from '@/lib/services/catalog.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteCod = searchParams.get('clienteCod') ?? undefined
    const termo = searchParams.get('termo') ?? undefined

    const data = await listCatalog({ clienteCod, termo })

    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar catalogo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
