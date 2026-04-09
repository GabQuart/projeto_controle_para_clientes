'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { AccountDirectoryEntry, UserAccount } from '@/types/account'

type FormState = {
  nome: string
  email: string
  role: 'admin' | 'cliente'
  loja: string
  clienteCods: string[]
  fornecedorPrefixes: string[]
}

const EMPTY_FORM: FormState = {
  nome: '',
  email: '',
  role: 'cliente',
  loja: '',
  clienteCods: [],
  fornecedorPrefixes: [],
}

export default function ContasPage() {
  const router = useRouter()
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [directory, setDirectory] = useState<AccountDirectoryEntry[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const [sessionResponse, accountsResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/contas?includeDirectory=1'),
        ])

        const sessionPayload = await sessionResponse.json()
        const accountsPayload = await accountsResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionPayload.error || 'Falha ao carregar sessao')
        }

        if (!sessionPayload.account) {
          router.replace('/login')
          return
        }

        if (sessionPayload.account.role !== 'admin') {
          router.replace('/catalogo')
          return
        }

        if (!accountsResponse.ok) {
          throw new Error(accountsPayload.error || 'Falha ao carregar contas')
        }

        setAccount(sessionPayload.account)
        setAccounts(accountsPayload.data ?? [])
        setDirectory(accountsPayload.directory ?? [])
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao carregar a tela de contas',
        })
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [router])

  const lojas = useMemo(() => Array.from(new Set(directory.map((entry) => entry.loja))).sort((a, b) => a.localeCompare(b, 'pt-BR')), [directory])
  const scopedDirectory = useMemo(() => directory.filter((entry) => entry.loja === form.loja), [directory, form.loja])
  const clienteOptions = useMemo(
    () => Array.from(new Set(scopedDirectory.map((entry) => entry.clienteCod))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [scopedDirectory],
  )
  const fornecedorOptions = useMemo(
    () => Array.from(new Set(scopedDirectory.map((entry) => entry.fornecedorPrefix))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [scopedDirectory],
  )

  function toggleValue(field: 'clienteCods' | 'fornecedorPrefixes', value: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!account) {
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/contas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          createdByEmail: account.email,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao criar conta')
      }

      const refreshResponse = await fetch('/api/contas?includeDirectory=1')
      const refreshPayload = await refreshResponse.json()

      if (refreshResponse.ok) {
        setAccounts(refreshPayload.data ?? [])
        setDirectory(refreshPayload.directory ?? [])
      }

      setForm(EMPTY_FORM)
      setFeedback({
        type: 'success',
        message: 'Conta criada com sucesso e pronta para usar login por e-mail.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao criar conta',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="panel rounded-[32px] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Gestao de contas</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">
              Cadastro de acessos para admin e clientes
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-steel sm:text-base">
              Admin atual: <span className="font-semibold text-ink">{account?.nome ?? 'Carregando...'}</span>
            </p>
          </div>
          <Link
            href="/catalogo"
            className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
          >
            Voltar ao catalogo
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="panel rounded-[32px] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber">Novo acesso</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              Nome
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder="Nome da conta"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder="cliente@empresa.com"
                required
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              Perfil
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as 'admin' | 'cliente',
                    loja: event.target.value === 'admin' ? '' : current.loja,
                    clienteCods: [],
                    fornecedorPrefixes: [],
                  }))
                }
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              >
                <option value="cliente" className="bg-slate text-ink">Cliente</option>
                <option value="admin" className="bg-slate text-ink">Admin</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              Loja
              <select
                value={form.loja}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    loja: event.target.value,
                    clienteCods: [],
                    fornecedorPrefixes: [],
                  }))
                }
                disabled={form.role === 'admin'}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
              >
                <option value="" className="bg-slate text-ink">Selecione</option>
                {lojas.map((loja) => (
                  <option key={loja} value={loja} className="bg-slate text-ink">
                    {loja}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.role === 'cliente' && form.loja === 'Presente Net' ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">Fornecedores liberados</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {fornecedorOptions.map((option) => (
                  <label key={option} className="brand-chip flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.fornecedorPrefixes.includes(option)}
                      onChange={() => toggleValue('fornecedorPrefixes', option)}
                      className="h-4 w-4 rounded border-white/10 bg-slate text-amber focus:ring-amber"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {form.role === 'cliente' && form.loja && form.loja !== 'Presente Net' ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">Clientes vinculados</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {clienteOptions.map((option) => (
                  <label key={option} className="brand-chip flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.clienteCods.includes(option)}
                      onChange={() => toggleValue('clienteCods', option)}
                      className="h-4 w-4 rounded border-white/10 bg-slate text-amber focus:ring-amber"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                feedback.type === 'success' ? 'border border-pine/30 bg-pine/10 text-pine' : 'border border-clay/30 bg-clay/10 text-clay'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Criar conta'}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink"
            >
              Limpar
            </button>
          </div>
        </form>

        <section className="panel rounded-[32px] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber">Contas cadastradas</p>
          {loading ? (
            <div className="mt-6 text-sm text-steel">Carregando lista de contas...</div>
          ) : (
            <div className="mt-6 grid gap-3">
              {accounts.map((item) => (
                <article key={item.id} className="brand-chip rounded-3xl p-4 text-sm text-steel">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.nome}</p>
                      <p>{item.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-cobalt/20 px-3 py-1 text-amber">{item.role}</span>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-ink">{item.ativo ? 'ativo' : 'inativo'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {item.role === 'admin' ? (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-ink">Acesso total</span>
                    ) : item.access.scopeType === 'fornecedor_prefix' ? (
                      item.access.fornecedorPrefixes.map((prefix) => (
                        <span key={prefix} className="rounded-full bg-white/5 px-3 py-1 text-ink">
                          Fornecedor {prefix}
                        </span>
                      ))
                    ) : (
                      item.access.clienteCods.map((clienteCod) => (
                        <span key={clienteCod} className="rounded-full bg-white/5 px-3 py-1 text-ink">
                          Cliente {clienteCod}
                        </span>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
