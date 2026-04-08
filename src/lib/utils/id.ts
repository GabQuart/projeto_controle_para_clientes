import { randomUUID } from 'crypto'

export function createSimpleId(prefix = 'id') {
  try {
    return `${prefix}_${randomUUID()}`
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}
