import { NextResponse } from 'next/server'
import { getAuthenticatedAccount } from '@/lib/services/account.service'
import { createProductRequest, getProductRequestOptions } from '@/lib/services/product-request.service'
import type { ProductRequestVariationType } from '@/types/product-request'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_FILES = 8
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024

function parseStringArray(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : []
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const data = await getProductRequestOptions(account)
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar opcoes da solicitacao'
    return NextResponse.json({ error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(request: Request) {
  try {
    const account = await getAuthenticatedAccount()

    if (!account) {
      return NextResponse.json({ error: 'Sessao autenticada nao encontrada.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }

    const formData = await request.formData()
    const images = formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (images.length > MAX_IMAGE_FILES) {
      throw new Error(`Envie no maximo ${MAX_IMAGE_FILES} imagens por solicitacao.`)
    }

    const encodedImages = await Promise.all(
      images.map(async (file) => {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(`A imagem ${file.name} excede o limite de 8 MB.`)
        }

        const arrayBuffer = await file.arrayBuffer()

        return {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Content: Buffer.from(arrayBuffer).toString('base64'),
        }
      }),
    )

    const data = await createProductRequest({
      account,
      store: String(formData.get('store') ?? ''),
      productName: String(formData.get('productName') ?? ''),
      productCost: Number(formData.get('productCost') ?? 0),
      sizes: parseStringArray(formData.get('sizes')),
      sizeChart: String(formData.get('sizeChart') ?? ''),
      variationType: String(formData.get('variationType') ?? 'cores') as ProductRequestVariationType,
      variations: parseStringArray(formData.get('variations')),
      notes: String(formData.get('notes') ?? ''),
      images: encodedImages,
    })

    return NextResponse.json({ data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar solicitacao de produto'
    return NextResponse.json({ error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
}
