import { NextResponse } from 'next/server'
import { filterCatalogProductsForAccount, getAuthenticatedAccount } from '@/lib/services/account.service'
import { getCatalogProductGallery, listCatalog } from '@/lib/services/catalog.service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const skuBase = searchParams.get('skuBase') ?? ''

    if (!skuBase.trim()) {
      return NextResponse.json(
        { error: 'Informe o skuBase para carregar a galeria.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json(
        { error: 'Sessao autenticada nao encontrada.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const catalog = await listCatalog()
    const product = filterCatalogProductsForAccount(account, catalog).find((item) => item.skuBase === skuBase)

    if (!product) {
      return NextResponse.json(
        { error: 'Produto nao encontrado para esta conta.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const images = await getCatalogProductGallery({ skuBase })

    return NextResponse.json(
      {
        data: images,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar a galeria do produto.'
    return NextResponse.json({ error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
