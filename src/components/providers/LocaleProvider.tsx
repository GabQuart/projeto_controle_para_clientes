'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppLocale, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, formatMessage, getMessages, isSupportedLocale, resolveMessage } from '@/lib/i18n/messages'

type TranslateValues = Record<string, string | number>

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: string, values?: TranslateValues) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

type LocaleProviderProps = {
  initialLocale: AppLocale
  children: ReactNode
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale)

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_COOKIE_NAME)

    if (savedLocale && isSupportedLocale(savedLocale) && savedLocale !== locale) {
      setLocaleState(savedLocale)
    }
  }, [locale])

  function setLocale(nextLocale: AppLocale) {
    setLocaleState(nextLocale)
    window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale)
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(nextLocale)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => {
        const resolved = resolveMessage(locale, key)
        const fallback = resolveMessage(DEFAULT_LOCALE, key)
        const message = typeof resolved === 'string' ? resolved : typeof fallback === 'string' ? fallback : key
        return formatMessage(message, values)
      },
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error('useLocale precisa ser usado dentro de LocaleProvider.')
  }

  return context
}

export function useTranslations() {
  return useLocale().t
}

export function useLocaleMessages() {
  const { locale } = useLocale()
  return getMessages(locale)
}
