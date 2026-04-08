'use client'

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
      <section className="order-2 flex-1 rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-panel backdrop-blur sm:rounded-[32px] sm:p-8 lg:order-1">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber">Operacao guiada</p>
        <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight text-ink sm:text-4xl lg:text-5xl">
          Catalogo, solicitacoes e historico em um fluxo direto para a operacao.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-ink/75 sm:text-base lg:text-lg">
          Esta primeira versao conecta o catalogo ao Google Sheets e registra solicitacoes em uma planilha separada, preservando o snapshot do item no momento do pedido.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm font-bold text-ink">Leitura segura</p>
            <p className="mt-2 text-sm text-steel">A planilha principal permanece somente leitura.</p>
          </div>
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm font-bold text-ink">Solicitacoes rastreaveis</p>
            <p className="mt-2 text-sm text-steel">Toda abertura grava historico com status inicial padrao.</p>
          </div>
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm font-bold text-ink">Filtro por operador</p>
            <p className="mt-2 text-sm text-steel">Cada acesso pode ser amarrado ao cliente e loja do operador.</p>
          </div>
        </div>
      </section>

      <section className="order-1 w-full max-w-xl rounded-[28px] border border-black/10 bg-ink p-5 text-white shadow-panel sm:rounded-[32px] sm:p-8 lg:order-2">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber">Login mockado</p>
        <h2 className="mt-4 text-2xl font-black sm:text-3xl">Entre com um operador de teste</h2>
        <p className="mt-3 text-sm text-white/70">
          O login inicial fica em estado local para acelerar o fluxo de validacao da primeira versao.
        </p>

        <div className="mt-8 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-white/85">
            Operador
            <select
              value={selectedEmail}
              onChange={(event) => setSelectedEmail(event.target.value)}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white outline-none focus:border-amber"
            >
              {operators.map((operator) => (
                <option key={operator.email} value={operator.email} className="text-ink">
                  {operator.nome} | {operator.perfil} | {operator.loja}
                </option>
              ))}
            </select>
          </label>

          {error ? <div className="rounded-2xl bg-clay/20 px-4 py-3 text-sm text-white">{error}</div> : null}

          <button
            type="button"
            onClick={handleEnter}
            disabled={loading || !selectedEmail}
            className="w-full rounded-full bg-amber px-5 py-3 text-sm font-bold text-white transition hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Carregando operadores...' : 'Entrar no catalogo'}
          </button>
        </div>

        <div className="mt-8 grid gap-3 text-sm sm:flex sm:flex-wrap">
          <Link href="/catalogo" className="rounded-full border border-white/20 px-4 py-3 text-center text-white/85 transition hover:border-white/40">
            Abrir catalogo
          </Link>
          <Link href="/historico" className="rounded-full border border-white/20 px-4 py-3 text-center text-white/85 transition hover:border-white/40">
            Abrir historico
          </Link>
        </div>
      </section>
    </main>
  )
}
