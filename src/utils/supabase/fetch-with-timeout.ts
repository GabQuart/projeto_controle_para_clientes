const SUPABASE_FETCH_TIMEOUT_MS = 5000

/**
 * Fetch com timeout curto para chamadas ao Supabase.
 * Evita que falhas de DNS/rede travem o servidor por 10+ segundos
 * e reduz o número de retries internos do SDK.
 */
export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS)

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}
