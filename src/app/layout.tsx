import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Oxanium, Sora } from 'next/font/google'
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
  description: 'Operacao de marketplaces com catalogo, solicitacoes e historico integrados.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const NAV_ITEMS = [
  {
    href: '/login',
    label: 'Login',
    icon: (
      <path
        d="M12 3a4 4 0 110 8 4 4 0 010-8zm0 10c4.418 0 8 2.015 8 4.5V20H4v-2.5C4 15.015 7.582 13 12 13z"
        fill="currentColor"
      />
    ),
  },
  {
    href: '/catalogo',
    label: 'Catalogo',
    icon: (
      <path
        d="M5 5.5A1.5 1.5 0 016.5 4H19v14.5a1.5 1.5 0 01-1.5 1.5H6.5A1.5 1.5 0 015 18.5v-13zm2 1v11h10V6.5H7zm1.5 2h7v1.5h-7V8.5zm0 3h7v1.5h-7V11.5z"
        fill="currentColor"
      />
    ),
  },
  {
    href: '/historico',
    label: 'Historico',
    icon: (
      <path
        d="M12 4a8 8 0 108 8h-2a6 6 0 11-1.757-4.243L14 10h6V4l-2.343 2.343A7.965 7.965 0 0012 4zm-.75 4h1.5v4.25l3 1.75-.75 1.299-3.75-2.174V8z"
        fill="currentColor"
      />
    ),
  },
]

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${oxanium.variable} font-sans`}>
        <div className="grid-shell min-h-screen">
          <header className="sticky top-0 z-40 border-b border-white/5 bg-slate/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/catalogo" className="flex items-center gap-4">
                    <div className="brand-chip brand-glow flex h-12 w-12 items-center justify-center rounded-2xl">
                      <span className="font-display text-xl font-bold tracking-[0.14em] text-amber">M3</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold uppercase tracking-[0.26em] text-ink sm:text-2xl">
                        M3rcadeo
                      </p>
                      <p className="text-xs uppercase tracking-[0.28em] text-steel">
                        Gestao e Operacao de Marketplaces
                      </p>
                    </div>
                  </Link>
                </div>

                <nav className="brand-scrollbar -mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 text-sm font-medium text-steel lg:mx-0 lg:w-auto lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="brand-chip flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 transition hover:border-amber/40 hover:text-ink"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-amber">
                        {item.icon}
                      </svg>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <div className="brand-line" />
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
