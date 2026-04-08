import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalogo Marketplace',
  description: 'Catalogo e solicitacoes operacionais integradas ao Google Sheets.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Catalogo Marketplace'

  return (
    <html lang="pt-BR">
      <body>
        <div className="grid-shell min-h-screen">
          <header className="border-b border-black/10 bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">Marketplace Ops</p>
                <Link href="/catalogo" className="block text-xl font-black tracking-tight text-ink sm:text-2xl">
                  {appName}
                </Link>
              </div>
              <nav className="-mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 text-sm font-medium text-ink/80 lg:mx-0 lg:w-auto lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0">
                <Link href="/login" className="shrink-0 rounded-full border border-black/10 px-4 py-2 transition hover:border-amber hover:text-amber">
                  Login
                </Link>
                <Link href="/catalogo" className="shrink-0 rounded-full border border-black/10 px-4 py-2 transition hover:border-amber hover:text-amber">
                  Catalogo
                </Link>
                <Link href="/historico" className="shrink-0 rounded-full border border-black/10 px-4 py-2 transition hover:border-amber hover:text-amber">
                  Historico
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
