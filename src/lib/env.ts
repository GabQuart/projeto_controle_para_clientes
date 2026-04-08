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
