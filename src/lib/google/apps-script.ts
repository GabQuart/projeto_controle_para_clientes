import { getOptionalEnv, getRequiredEnv } from '@/lib/env'

type AppsScriptRequestOptions = {
  method?: 'GET' | 'POST'
  query?: Record<string, string | undefined>
  body?: Record<string, unknown>
}

type AppsScriptEnvelope<T> = {
  ok: boolean
  data?: T
  error?: string
}

function buildAppsScriptUrl(action: string, query?: Record<string, string | undefined>) {
  const url = new URL(getRequiredEnv('APPS_SCRIPT_WEB_APP_URL'))
  url.searchParams.set('action', action)

  const token = getOptionalEnv('APPS_SCRIPT_TOKEN')
  if (token) {
    url.searchParams.set('token', token)
  }

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

export async function requestAppsScript<T>(action: string, options: AppsScriptRequestOptions = {}) {
  const method = options.method ?? 'GET'
  const url = buildAppsScriptUrl(action, method === 'GET' ? options.query : undefined)
  const token = getOptionalEnv('APPS_SCRIPT_TOKEN')

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body:
      method === 'POST'
        ? JSON.stringify({
            ...(options.body ?? {}),
            ...(token ? { token } : {}),
          })
        : undefined,
    cache: 'no-store',
  })

  const text = await response.text()
  let payload: AppsScriptEnvelope<T>

  try {
    payload = JSON.parse(text) as AppsScriptEnvelope<T>
  } catch {
    throw new Error('Resposta invalida do Apps Script')
  }

  if (!response.ok || !payload.ok || payload.data === undefined) {
    throw new Error(payload.error || 'Falha na comunicacao com o Apps Script')
  }

  return payload.data
}
