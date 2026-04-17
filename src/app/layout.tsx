import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Oxanium, Sora } from 'next/font/google'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { ThemeProvider, type AppTheme, THEME_COOKIE } from '@/components/providers/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RequestQueueProvider } from '@/contexts/RequestQueueContext'
import { QueueStatusBadge } from '@/components/QueueStatusBadge'
import { getAuthenticatedAccount } from '@/lib/services/account.service'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, getMessages, isSupportedLocale, resolveMessage, type AppLocale } from '@/lib/i18n/messages'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

const oxanium = Oxanium({
  subsets: ['latin'],
  variable: '--font-oxanium',
})

export const metadata: Metadata = {
  title: 'M3rcadeo | Catalogo Marketplace',
  description: 'Catalogo, operacao e historico da M3rcadeo.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const NAV_ITEMS = [
  {
    href: '/login',
    labelKey: 'layout.nav.login',
    adminOnly: false,
    icon: (
      <path
        d="M12 3a4 4 0 110 8 4 4 0 010-8zm0 10c4.418 0 8 2.015 8 4.5V20H4v-2.5C4 15.015 7.582 13 12 13z"
        fill="currentColor"
      />
    ),
  },
  {
    href: '/catalogo',
    labelKey: 'layout.nav.catalog',
    adminOnly: false,
    icon: (
      <path
        d="M5 5.5A1.5 1.5 0 016.5 4H19v14.5a1.5 1.5 0 01-1.5 1.5H6.5A1.5 1.5 0 015 18.5v-13zm2 1v11h10V6.5H7zm1.5 2h7v1.5h-7V8.5zm0 3h7v1.5h-7V11.5z"
        fill="currentColor"
      />
    ),
  },
  {
    href: '/historico',
    labelKey: 'layout.nav.history',
    adminOnly: false,
    icon: (
      <path
        d="M12 4a8 8 0 108 8h-2a6 6 0 11-1.757-4.243L14 10h6V4l-2.343 2.343A7.965 7.965 0 0012 4zm-.75 4h1.5v4.25l3 1.75-.75 1.299-3.75-2.174V8z"
        fill="currentColor"
      />
    ),
  },
  {
    href: '/contas',
    labelKey: 'layout.nav.accounts',
    adminOnly: true,
    icon: (
      <path
        d="M6 5.5A2.5 2.5 0 018.5 3h7A2.5 2.5 0 0118 5.5v13a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 016 18.5v-13zm2 0v13h7v-13h-7zm1.5 2h4v1.5h-4V7.5zm0 3h4v1.5h-4v-1.5zm0 3h2.75V15H9.5v-1.5z"
        fill="currentColor"
      />
    ),
  },
]

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE
  const locale: AppLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
  const rawTheme = cookieStore.get(THEME_COOKIE)?.value
  const theme: AppTheme = rawTheme === 'light' ? 'light' : 'dark'
  const isRtl = locale === 'ar'
  const t = getMessages(locale)
  const account = await Promise.race([
    getAuthenticatedAccount().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ])
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || account?.role === 'admin')

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} data-theme={theme}>
      <body className={`${sora.variable} ${oxanium.variable} font-sans`}>
        <ThemeProvider initialTheme={theme}>
        <LocaleProvider initialLocale={locale}>
        <RequestQueueProvider>
          <div className="grid-shell min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-slate/80 backdrop-blur-xl" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <Link href="/catalogo" className="flex min-w-0 items-center gap-4">
                      <div className="brand-glow flex h-14 w-14 items-center justify-center overflow-hidden rounded-full" style={{ border: '1px solid var(--logo-border)', background: 'var(--logo-bg)', boxShadow: 'var(--logo-shadow)' }}>
                        <Image
                          src="/branding/m3rcadeo-header-seal.png"
                          alt="Logo M3rcadeo"
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                          priority
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-semibold uppercase tracking-[0.22em] text-ink sm:text-xl lg:text-2xl">
                          {t.layout.brandName}
                        </p>
                        <p className="truncate text-[10px] uppercase tracking-[0.22em] text-steel sm:text-xs sm:tracking-[0.28em]">{t.layout.tagline}</p>
                      </div>
                    </Link>
                  </div>

                  <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3 lg:w-auto lg:items-end">
                    <div className="flex items-center justify-end gap-2">
                      <QueueStatusBadge />
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                    <nav className="brand-scrollbar -mx-1 flex w-full max-w-full gap-2 overflow-x-auto px-1 pb-1 text-[11px] font-medium text-steel sm:justify-end sm:text-sm lg:mx-0 lg:w-auto lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0">
                      {visibleNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="brand-chip flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] transition hover:border-amber/40 hover:text-ink sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-amber">
                            {item.icon}
                          </svg>
                          <span className="whitespace-nowrap">{String(resolveMessage(locale, item.labelKey) ?? item.href)}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
              <div className="brand-line" />
            </header>
            {children}
          </div>
        </RequestQueueProvider>
        </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
