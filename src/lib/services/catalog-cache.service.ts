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

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  throw lastError
}

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

async function persistPayload(payload: CatalogCachePayload) {
  memoryCache = payload
  await writeCacheFile(payload)
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

    // Cache desatualizado mas existe — entrega imediatamente e atualiza em segundo plano
    if (diskCache) {
      memoryCache = diskCache

      if (!pendingRefresh) {
        pendingRefresh = (async () => {
          const items = await withRetry(loader)
          const payload = { updatedAt: new Date().toISOString(), items }
          await persistPayload(payload)
          return payload
        })()
        pendingRefresh.finally(() => { pendingRefresh = null })
      }

      return {
        items: diskCache.items,
        metadata: {
          updatedAt: diskCache.updatedAt,
          source: 'cache-stale',
        } satisfies CatalogCacheMetadata,
      }
    }
  }

  // forceRefresh: descarta qualquer refresh em andamento para garantir dados frescos do DB
  if (options.forceRefresh) {
    pendingRefresh = null
  }

  // Sem cache nenhum — carrega bloqueando (só na primeira vez)
  if (pendingRefresh) {
    const payload = await pendingRefresh

    return {
      items: payload.items,
      metadata: {
        updatedAt: payload.updatedAt,
        source: 'supabase',
      } satisfies CatalogCacheMetadata,
    }
  }

  pendingRefresh = (async () => {
    const items = await withRetry(loader)
    const payload = {
      updatedAt: new Date().toISOString(),
      items,
    }

    await persistPayload(payload)

    return payload
  })()

  try {
    const payload = await pendingRefresh

    return {
      items: payload.items,
      metadata: {
        updatedAt: payload.updatedAt,
        source: 'supabase',
      } satisfies CatalogCacheMetadata,
    }
  } finally {
    pendingRefresh = null
  }
}

export async function patchCatalogCacheItems(
  updater: (items: CatalogProduct[]) => CatalogProduct[],
) {
  const sourcePayload = memoryCache ?? (await readCacheFile())

  if (!sourcePayload) {
    return null
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    items: updater(sourcePayload.items),
  }

  await persistPayload(payload)
  return payload
}
