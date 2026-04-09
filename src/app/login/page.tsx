'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Operator } from '@/types/operator'

const STORAGE_KEY = 'catalogo-marketplace.operator'

export default function LoginPage() {
  const router = useRouter()
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOperators() {
      try {
        const response = await fetch('/api/operadores')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar operadores')
        }

        setOperators(payload.data)
        setSelectedEmail(payload.data[0]?.email ?? '')
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar operadores')
      } finally {
        setLoading(false)
      }
    }

    loadOperators()
  }, [])

  function handleEnter() {
    const operator = operators.find((item) => item.email === selectedEmail)

    if (!operator) {
      setError('Selecione um operador valido para continuar.')
      return
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(operator))
    router.push('/catalogo')
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:px-8 lg:py-12">
      <section className="order-2 flex-1 rounded-[32px] panel p-5 sm:p-8 lg:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">M3rcadeo Command Layer</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
          Gestao visual de catalogo com a assinatura operacional da M3rcadeo.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-steel sm:text-base lg:text-lg">
          Esta base foi remodelada para seguir a identidade da empresa: azul neon, superfícies escuras e leitura rápida
          para operação de marketplaces.
        </p>

        <div className="brand-wordmark-frame brand-glow mt-8 overflow-hidden rounded-[28px] p-3">
          <Image
            src="/branding/m3rcadeo-wordmark.png"
            alt="Logo M3rcadeo"
            width={1152}
            height={768}
            className="h-auto w-full rounded-[22px] object-cover"
            priority
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Leitura segura</p>
            <p className="mt-2 text-sm text-steel">A planilha principal continua blindada como fonte somente leitura.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Historico vivo</p>
            <p className="mt-2 text-sm text-steel">Cada acao abre uma trilha rastreavel com snapshot e status operacional.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Recorte por operador</p>
            <p className="mt-2 text-sm text-steel">A visao do catalogo fica alinhada a cliente e loja desde o primeiro acesso.</p>
          </div>
        </div>
      </section>

      <section className="order-1 w-full max-w-xl rounded-[32px] panel p-5 sm:p-8 lg:order-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Acesso inicial</p>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">Entre com um operador de teste</h2>
        <p className="mt-3 text-sm text-steel">
          O login permanece mockado nesta fase, mas a interface ja segue a identidade visual da M3rcadeo.
        </p>

        <div className="mt-8 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-steel">
            Operador
            <select
              value={selectedEmail}
              onChange={(event) => setSelectedEmail(event.target.value)}
              disabled={loading}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40"
            >
              {operators.map((operator) => (
                <option key={operator.email} value={operator.email} className="bg-slate text-ink">
                  {operator.nome} | {operator.perfil} | {operator.loja}
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}

          <button
            type="button"
            onClick={handleEnter}
            disabled={loading || !selectedEmail}
            className="w-full rounded-full bg-cobalt px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Carregando operadores...' : 'Entrar no catalogo'}
          </button>
        </div>

        <div className="mt-8 grid gap-3 text-sm sm:flex sm:flex-wrap">
          <Link href="/catalogo" className="brand-chip rounded-full px-4 py-3 text-center text-ink transition hover:border-amber/40 hover:text-amber">
            Abrir catalogo
          </Link>
          <Link href="/historico" className="brand-chip rounded-full px-4 py-3 text-center text-ink transition hover:border-amber/40 hover:text-amber">
            Abrir historico
          </Link>
        </div>
      </section>
    </main>
  )
}
