import { NextResponse } from 'next/server'
import { getDriveImageData, resolveReferenceImage } from '@/lib/google/drive'

const IMAGE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
}

function placeholderResponse(request: Request) {
  return NextResponse.redirect(new URL('/placeholder-product.svg', request.url))
}

function imageResponse(buffer: ArrayBuffer, contentType: string) {
  return new NextResponse(buffer, {
    headers: {
      ...IMAGE_CACHE_HEADERS,
      'Content-Type': contentType,
    },
  })
}

async function fetchPublicDriveImage(url?: string) {
  if (!url) {
    return null
  }

  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'follow',
  })
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
    return null
  }

  const buffer = await response.arrayBuffer()

  if (buffer.byteLength === 0) {
    return null
  }

  return imageResponse(buffer, contentType)
}

async function fetchAppsScriptDriveImage(fileId?: string) {
  if (!fileId) {
    return null
  }

  const image = await getDriveImageData(fileId)

  if (!image.mimeType.toLowerCase().startsWith('image/') || !image.base64Content) {
    return null
  }

  const buffer = Buffer.from(image.base64Content, 'base64')
  return imageResponse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), image.mimeType)
}

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

    const publicImageResponse = await fetchPublicDriveImage(reference.usableUrl ?? reference.originalUrl)

    if (publicImageResponse) {
      return publicImageResponse
    }

    const appsScriptImageResponse = await fetchAppsScriptDriveImage(reference.fileId)

    if (appsScriptImageResponse) {
      return appsScriptImageResponse
    }

    return placeholderResponse(request)
  } catch {
    return placeholderResponse(request)
  }
}
