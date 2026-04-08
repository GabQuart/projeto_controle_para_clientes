import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getOptionalIntEnv } from '@/lib/env'
import type { CatalogCacheMetadata, CatalogProduct } from '@/types/catalog'

const DEFAULT_CACHE_TTL_MINUTES = 10
const CACHE_DIR = path.join(process.cwd(), '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'catalog.json')

type CatalogCachePayload = {
  updatedAt: string
  items: CatalogProduct[]
}

let memoryCache: CatalogCachePayload | null = null
let pendingRefresh: Promise<CatalogCachePayload> | null = null

function getCacheTtlMs() {
  const minutes = Math.max(1, getOptionalIntEnv('CATALOG_CACHE_TTL_MINUTES', DEFAULT_CACHE_TTL_MINUTES))
  return minutes * 60 * 1000
}

function isFresh(updatedAt: string) {
  const timestamp = new Date(updatedAt).getTime()

  if (Number.isNaN(timestamp)) {
    return false
  }

  return Date.now() - timestamp < getCacheTtlMs()
}

function isValidPayload(payload: unknown): payload is CatalogCachePayload {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Partial<CatalogCachePayload>
  return typeof candidate.updatedAt === 'string' && Array.isArray(candidate.items)
}

async function readCacheFile() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    const payload = JSON.parse(raw) as unknown

    if (!isValidPayload(payload)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

async function writeCacheFile(payload: CatalogCachePayload) {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8')
}

export async function getCatalogCache(
  loader: () => Promise<CatalogProduct[]>,
  options: { forceRefresh?: boolean } = {},
) {
  if (!options.forceRefresh && memoryCache && isFresh(memoryCache.updatedAt)) {
    return {
      items: memoryCache.items,
      metadata: {
        updatedAt: memoryCache.updatedAt,
        source: 'cache',
      } satisfies CatalogCacheMetadata,
    }
  }

  if (!options.forceRefresh) {
    const diskCache = await readCacheFile()

    if (diskCache && isFresh(diskCache.updatedAt)) {
      memoryCache = diskCache

      return {
        items: diskCache.items,
        metadata: {
          updatedAt: diskCache.updatedAt,
          source: 'cache',
        } satisfies CatalogCacheMetadata,
      }
    }
  }

  if (pendingRefresh) {
    const payload = await pendingRefresh

    return {
      items: payload.items,
      metadata: {
        updatedAt: payload.updatedAt,
        source: 'apps_script',
      } satisfies CatalogCacheMetadata,
    }
  }

  pendingRefresh = (async () => {
    const items = await loader()
    const payload = {
      updatedAt: new Date().toISOString(),
      items,
    }

    memoryCache = payload
    await writeCacheFile(payload)

    return payload
  })()

  try {
    const payload = await pendingRefresh

    return {
      items: payload.items,
      metadata: {
        updatedAt: payload.updatedAt,
        source: 'apps_script',
      } satisfies CatalogCacheMetadata,
    }
  } finally {
    pendingRefresh = null
  }
}
