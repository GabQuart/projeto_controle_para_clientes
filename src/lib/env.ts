export function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`)
  }

  return value
}

export function getOptionalEnv(name: string) {
  return process.env[name]?.trim() || ''
}

export function getOptionalIntEnv(name: string, fallback: number) {
  const value = getOptionalEnv(name)
  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed)) {
    return fallback
  }

  return parsed
}
