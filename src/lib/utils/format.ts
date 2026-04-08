export function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function splitList(value?: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinList(values?: Array<string | null | undefined>) {
  return (values ?? []).filter(Boolean).join(', ')
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function toBooleanFlag(value?: string | boolean | null) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = normalizeText(String(value ?? ''))
  return ['sim', 'true', 'ativo', '1', 'yes'].includes(normalized)
}

export function compactText(value?: string | null) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}
