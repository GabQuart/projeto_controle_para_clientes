// ─── Tipos ────────────────────────────────────────────────────────────────────

export type QueuedFile = {
  fieldName: string
  fileName: string
  mimeType: string
  base64: string
}

export type QueuedJsonRequest = {
  id: string
  type: 'json'
  endpoint: string
  body: Record<string, unknown>
  label: string
  createdAt: string
  attempts: number
}

export type QueuedFormRequest = {
  id: string
  type: 'form'
  endpoint: string
  fields: Record<string, string>
  files: QueuedFile[]
  label: string
  createdAt: string
  attempts: number
}

export type QueuedRequest = QueuedJsonRequest | QueuedFormRequest

export type FlushResult = {
  sent: number
  failed: number
  removed: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DB_NAME = 'catalogo_offline_queue'
const DB_VERSION = 1
const STORE_NAME = 'requests'
const MAX_ATTEMPTS = 5

// ─── IndexedDB ────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Leitura de arquivo ────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ─── Operações da fila ────────────────────────────────────────────────────────

export async function enqueueJsonRequest(
  endpoint: string,
  body: Record<string, unknown>,
  label: string,
): Promise<string> {
  const db = await openDB()

  const item: QueuedJsonRequest = {
    id: generateId(),
    type: 'json',
    endpoint,
    body,
    label,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(item)
    tx.oncomplete = () => resolve(item.id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function enqueueFormRequest(
  endpoint: string,
  fields: Record<string, string>,
  rawFiles: Array<{ fieldName: string; file: File }>,
  label: string,
): Promise<string> {
  const db = await openDB()

  const files: QueuedFile[] = await Promise.all(
    rawFiles.map(async ({ fieldName, file }) => ({
      fieldName,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64: await fileToBase64(file),
    })),
  )

  const item: QueuedFormRequest = {
    id: generateId(),
    type: 'form',
    endpoint,
    fields,
    files,
    label,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(item)
    tx.oncomplete = () => resolve(item.id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listQueuedRequests(): Promise<QueuedRequest[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedRequest[])
    req.onerror = () => reject(req.error)
  })
}

export async function countQueuedRequests(): Promise<number> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function removeRequest(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function incrementAttempts(item: QueuedRequest): Promise<void> {
  const db = await openDB()
  const updated = { ...item, attempts: item.attempts + 1 }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(updated)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Reconstrução do fetch ────────────────────────────────────────────────────

function buildFetchArgs(item: QueuedRequest): [string, RequestInit] {
  if (item.type === 'json') {
    return [
      item.endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      },
    ]
  }

  const formData = new FormData()

  for (const [key, value] of Object.entries(item.fields)) {
    formData.set(key, value)
  }

  for (const file of item.files) {
    const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: file.mimeType })
    formData.append(file.fieldName, blob, file.fileName)
  }

  return [item.endpoint, { method: 'POST', body: formData }]
}

// ─── Flush ────────────────────────────────────────────────────────────────────

export async function flushQueue(): Promise<FlushResult> {
  const items = await listQueuedRequests()
  const result: FlushResult = { sent: 0, failed: 0, removed: 0 }

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) {
      await removeRequest(item.id)
      result.removed++
      continue
    }

    try {
      const [url, init] = buildFetchArgs(item)
      const response = await fetch(url, init)

      if (response.ok) {
        await removeRequest(item.id)
        result.sent++
      } else {
        await incrementAttempts(item)
        result.failed++
      }
    } catch {
      await incrementAttempts(item)
      result.failed++
    }
  }

  return result
}

// ─── Detecção de erro de rede ─────────────────────────────────────────────────

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('load failed')
  )
}
