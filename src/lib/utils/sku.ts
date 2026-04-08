export function normalizeSku(value?: string | null) {
  return (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function extractSkuBase(value?: string | null) {
  const normalized = normalizeSku(value)

  if (!normalized) {
    return ''
  }

  const parts = normalized.split('.')

  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`
  }

  return normalized
}

export function matchesSkuTerm(targets: Array<string | undefined>, term?: string | null) {
  const normalizedTerm = normalizeSku(term)

  if (!normalizedTerm) {
    return true
  }

  return targets.some((target) => normalizeSku(target).includes(normalizedTerm))
}
