'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AppTheme = 'dark' | 'light'

export const THEME_COOKIE = 'theme'
const THEME_STORAGE_KEY = 'theme'

type ThemeContextValue = {
  theme: AppTheme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme: AppTheme
}) {
  const [theme, setTheme] = useState<AppTheme>(initialTheme)

  // Aplica o tema no elemento <html> quando muda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next: AppTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    // Persiste em cookie (lido pelo servidor no próximo request)
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    // Persiste em localStorage também
    try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
