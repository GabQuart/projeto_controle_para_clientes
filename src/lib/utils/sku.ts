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

export function compareSkuNaturally(left?: string | null, right?: string | null) {
  const leftParts = normalizeSku(left).match(/\d+|\D+/g) ?? []
  const rightParts = normalizeSku(right).match(/\d+|\D+/g) ?? []
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? ''
    const rightPart = rightParts[index] ?? ''

    if (leftPart === rightPart) {
      continue
    }

    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : Number.NaN
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : Number.NaN

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
      return leftNumber - rightNumber
    }

    const compared = leftPart.localeCompare(rightPart, 'pt-BR')
    if (compared !== 0) {
      return compared
    }
  }

  return 0
}
