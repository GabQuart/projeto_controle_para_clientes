export function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} nao configurada.`)
  }

  return value
}

export function getOptionalEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback
}

export function getOptionalIntEnv(name: string, fallback: number) {
  const value = getOptionalEnv(name)
  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed)) {
    return fallback
  }

  return parsed
}

export function getSupabasePublicEnv() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    publishableKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'),
  }
}

export function getSupabaseServiceRoleKey() {
  return getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
}
