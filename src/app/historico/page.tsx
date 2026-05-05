'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { HistoryTable } from '@/components/HistoryTable'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useTranslations } from '@/components/providers/LocaleProvider'
import { SearchBar } from '@/components/SearchBar'
import { normalizeText } from '@/lib/utils/format'
import { compareSkuNaturally } from '@/lib/utils/sku'
import type { UserAccount } from '@/types/account'
import type { RequestHistoryEntry, RequestHistoryStatus, RequestHistoryType } from '@/types/request'

type HistorySortOrder = 'recentes' | 'sku_asc' | 'sku_desc'

function getRequestSkuForSort(request: RequestHistoryEntry) {
  return request.skuVariacao || request.skuBase || request.id
}

export default function HistoricoPage() {
  const t = useTranslations()
  const router = useRouter()
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [requests, setRequests] = useState<RequestHistoryEntry[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RequestHistoryStatus | 'todos'>('todos')
  const [requestType, setRequestType] = useState<RequestHistoryType | 'todos'>('todos')
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('recentes')
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState('')
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

        if (requestType !== 'todos') {
          params.set('tipoSolicitacao', requestType)
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
  }, [account, requestType, router, status])

  async function handleCancelRequest(request: RequestHistoryEntry) {
    if (!window.confirm(t('history.cancelConfirm'))) {
      return
    }

    setCancelingId(request.id)
    setError('')

    try {
      const response = await fetch('/api/solicitacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          tipoSolicitacao: request.tipoSolicitacao,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/login')
          return
        }

        throw new Error(payload.error || 'Falha ao cancelar solicitacao')
      }

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? { ...item, status: 'cancelado', dataConclusao: new Date().toISOString() } : item)),
      )
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Falha ao cancelar solicitacao')
    } finally {
      setCancelingId('')
    }
  }

  const filteredRequests = useMemo(() => {
    const normalized = normalizeText(search)
    const matchedRequests = normalized
      ? requests.filter((request) => {
          const searchBlob = normalizeText(`${request.titulo} ${request.skuBase} ${request.skuVariacao ?? ''} ${request.detalhe} ${request.id}`)
          return searchBlob.includes(normalized)
        })
      : requests

    if (sortOrder === 'recentes') {
      return matchedRequests
    }

    return [...matchedRequests].sort((left, right) => {
      const compared = compareSkuNaturally(getRequestSkuForSort(left), getRequestSkuForSort(right))
      return sortOrder === 'sku_asc' ? compared : -compared
    })
  }, [requests, search, sortOrder])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[32px] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">{t('history.label')}</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">{t('history.title')}</h1>
            <p className="mt-3 text-sm text-steel sm:text-base">{account?.nome ?? 'Carregando...'}</p>
          </div>
          <Link
            href="/catalogo"
            className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
          >
            {t('common.backToCatalog')}
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_220px_220px_240px]">
          <SearchBar value={search} onChange={setSearch} placeholder={t('history.searchPlaceholder')} label={t('history.searchLabel')} />
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            {t('history.type')}
            <select
              value={requestType}
              onChange={(event) => setRequestType(event.target.value as RequestHistoryType | 'todos')}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
            >
              <option value="todos" className="bg-slate text-ink">{t('history.typeOptions.all')}</option>
              <option value="operacional" className="bg-slate text-ink">{t('history.typeOptions.operational')}</option>
              <option value="novo_produto" className="bg-slate text-ink">{t('history.typeOptions.newProduct')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            {t('history.status')}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as RequestHistoryStatus | 'todos')}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
            >
              <option value="todos" className="bg-slate text-ink">{t('history.statusOptions.all')}</option>
              <option value="pendente" className="bg-slate text-ink">{t('history.statusOptions.pending')}</option>
              <option value="nao_concluido" className="bg-slate text-ink">{t('history.statusOptions.notCompleted')}</option>
              <option value="em_andamento" className="bg-slate text-ink">{t('history.statusOptions.inProgress')}</option>
              <option value="concluido" className="bg-slate text-ink">{t('history.statusOptions.completed')}</option>
              <option value="cancelado" className="bg-slate text-ink">{t('history.statusOptions.canceled')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            {t('history.sort')}
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as HistorySortOrder)}
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
            >
              <option value="recentes" className="bg-slate text-ink">{t('history.sortOptions.recent')}</option>
              <option value="sku_asc" className="bg-slate text-ink">{t('history.sortOptions.skuAsc')}</option>
              <option value="sku_desc" className="bg-slate text-ink">{t('history.sortOptions.skuDesc')}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6">
        {error ? <div className="mb-4 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div> : null}
        {loading ? (
          <div className="panel rounded-3xl p-6 text-sm text-steel">{t('history.loading')}</div>
        ) : (
          <HistoryTable requests={filteredRequests} onCancel={handleCancelRequest} cancelingId={cancelingId} />
        )}
      </section>
      <LoadingOverlay open={loading || Boolean(cancelingId)} label={cancelingId ? t('history.canceling') : t('history.loading')} />
    </main>
  )
}
