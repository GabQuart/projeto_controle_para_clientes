import type { UserAccount } from '@/types/account'

export const ACCOUNT_STORAGE_KEY = 'catalogo-marketplace.account'

export function parseStoredAccount(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as UserAccount
  } catch {
    return null
  }
}
