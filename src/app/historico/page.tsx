'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { HistoryTable } from '@/components/HistoryTable'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { SearchBar } from '@/components/SearchBar'
import { normalizeText } from '@/lib/utils/format'
import type { UserAccount } from '@/types/account'
import type { ChangeRequest, ChangeRequestStatus } from '@/types/request'

export default function HistoricoPage() {
  const router = useRouter()
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ChangeRequestStatus | 'todos'>('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar sessao')
        }

        if (!payload.account) {
          router.replace('/login')
          return
        }

        setAccount(payload.account)
      } catch {
        router.replace('/login')
      }
    }

    loadSession()
  }, [router])

  useEffect(() => {
    if (!account) {
      return
    }

    async function loadHistory() {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()

        if (status !== 'todos') {
          params.set('status', status)
        }

        const response = await fetch(`/api/solicitacoes?${params.toString()}`, { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/login')
            return
          }

          throw new Error(payload.error || 'Falha ao carregar historico')
        }

        setRequests(payload.data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar historico')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [account, status])

  const filteredRequests = useMemo(() => {
    const normalized = normalizeText(search)

    if (!normalized) {
      return requests
    }

    return requests.filter((request) => {
      const searchBlob = normalizeText(`${request.titulo} ${request.skuBase} ${request.skuVariacao ?? ''} ${request.detalhe}`)
      return searchBlob.includes(normalized)
    })
  }, [requests, search])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[32px] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Historico</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">Solicitacoes da conta</h1>
            <p className="mt-3 text-sm text-steel sm:text-base">{account?.nome ?? 'Carregando...'}</p>
          </div>
          <Link
            href="/catalogo"
            className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
          >
            Voltar ao catalogo
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_280px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome, SKU ou detalhe" label="Busca no historico" />
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ChangeRequestStatus | 'todos')}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
            >
              <option value="todos" className="bg-slate text-ink">Todos</option>
              <option value="nao_concluido" className="bg-slate text-ink">Nao concluido</option>
              <option value="em_andamento" className="bg-slate text-ink">Em andamento</option>
              <option value="concluido" className="bg-slate text-ink">Concluido</option>
              <option value="cancelado" className="bg-slate text-ink">Cancelado</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6">
        {error ? <div className="mb-4 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}
        {loading ? (
          <div className="panel rounded-3xl p-6 text-sm text-steel">Carregando historico...</div>
        ) : (
          <HistoryTable requests={filteredRequests} />
        )}
      </section>
      <LoadingOverlay open={loading} label="Carregando historico..." />
    </main>
  )
}
