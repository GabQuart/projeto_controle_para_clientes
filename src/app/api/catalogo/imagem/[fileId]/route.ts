import { NextResponse } from 'next/server'
import { resolveReferenceImage } from '@/lib/google/drive'

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')

  try {
    const reference = kind === 'folder'
      ? await resolveReferenceImage(`https://drive.google.com/drive/folders/${fileId}`)
      : await resolveReferenceImage(fileId)

    const redirectTarget = reference.usableUrl ?? reference.originalUrl

    if (!redirectTarget) {
      return NextResponse.redirect(new URL('/placeholder-product.svg', request.url))
    }

    return NextResponse.redirect(redirectTarget)
  } catch {
    return NextResponse.redirect(new URL('/placeholder-product.svg', request.url))
  }
}
