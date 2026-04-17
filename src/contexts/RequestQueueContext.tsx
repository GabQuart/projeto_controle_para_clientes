'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  countQueuedRequests,
  enqueueFormRequest,
  enqueueJsonRequest,
  flushQueue,
} from '@/lib/queue/request-queue'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RequestQueueContextValue = {
  pendingCount: number
  isFlushing: boolean
  addJsonRequest: (
    endpoint: string,
    body: Record<string, unknown>,
    label: string,
  ) => Promise<void>
  addFormRequest: (
    endpoint: string,
    fields: Record<string, string>,
    files: Array<{ fieldName: string; file: File }>,
    label: string,
  ) => Promise<void>
  flushNow: () => Promise<void>
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const RequestQueueContext = createContext<RequestQueueContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RequestQueueProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isFlushing, setIsFlushing] = useState(false)
  const isFlushingRef = useRef(false)

  const refreshCount = useCallback(async () => {
    try {
      const count = await countQueuedRequests()
      setPendingCount(count)
    } catch {
      // IndexedDB indisponível (SSR ou browser restrito)
    }
  }, [])

  const flushNow = useCallback(async () => {
    if (isFlushingRef.current) return
    isFlushingRef.current = true
    setIsFlushing(true)

    try {
      await flushQueue()
    } catch {
      // Falha silenciosa — tenta novamente na próxima conexão
    } finally {
      isFlushingRef.current = false
      setIsFlushing(false)
      await refreshCount()
    }
  }, [refreshCount])

  // Carrega contagem inicial e ouve eventos de conexão
  useEffect(() => {
    refreshCount()

    const handleOnline = () => { flushNow() }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refreshCount, flushNow])

  const addJsonRequest = useCallback(
    async (endpoint: string, body: Record<string, unknown>, label: string) => {
      await enqueueJsonRequest(endpoint, body, label)
      await refreshCount()
    },
    [refreshCount],
  )

  const addFormRequest = useCallback(
    async (
      endpoint: string,
      fields: Record<string, string>,
      files: Array<{ fieldName: string; file: File }>,
      label: string,
    ) => {
      await enqueueFormRequest(endpoint, fields, files, label)
      await refreshCount()
    },
    [refreshCount],
  )

  return (
    <RequestQueueContext.Provider
      value={{ pendingCount, isFlushing, addJsonRequest, addFormRequest, flushNow }}
    >
      {children}
    </RequestQueueContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRequestQueue() {
  const ctx = useContext(RequestQueueContext)
  if (!ctx) {
    throw new Error('useRequestQueue deve ser usado dentro de RequestQueueProvider')
  }
  return ctx
}
