'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className="brand-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-steel transition hover:border-amber/50 hover:text-amber"
    >
      {isDark ? (
        /* Ícone sol — aparece no dark para ir para light */
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zM22 11a1 1 0 0 1 0 2h-1a1 1 0 1 1 0-2h1zM3 11a1 1 0 0 1 0 2H2a1 1 0 1 1 0-2h1zm15.657-6.657a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM6.464 17.536a1 1 0 0 1 0 1.414l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm12.193 0a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM6.464 6.464a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414z" />
        </svg>
      ) : (
        /* Ícone lua — aparece no light para ir para dark */
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
