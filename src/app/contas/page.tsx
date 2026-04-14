'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useTranslations } from '@/components/providers/LocaleProvider'
import type { AccountDirectoryEntry, UserAccount } from '@/types/account'

type FormState = {
  nome: string
  email: string
  role: 'admin' | 'cliente'
  loja: string
  clienteCods: string[]
  fornecedorPrefixes: string[]
  provisionAuthUser: boolean
  temporaryPassword: string
  confirmEmail: boolean
}

const EMPTY_FORM: FormState = {
  nome: '',
  email: '',
  role: 'cliente',
  loja: '',
  clienteCods: [],
  fornecedorPrefixes: [],
  provisionAuthUser: true,
  temporaryPassword: '',
  confirmEmail: true,
}

export default function ContasPage() {
  const t = useTranslations()
  const router = useRouter()
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [directory, setDirectory] = useState<AccountDirectoryEntry[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingDirectory, setSyncingDirectory] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function loadAccountsBundle(refreshDirectory = false) {
    const response = await fetch(`/api/contas?includeDirectory=1${refreshDirectory ? '&refreshDirectory=1' : ''}`, {
      cache: 'no-store',
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao carregar contas')
    }

    return payload as { data?: UserAccount[]; directory?: AccountDirectoryEntry[] }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const sessionResponse = await fetch('/api/auth/me', { cache: 'no-store' })
        const sessionPayload = await sessionResponse.json()

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

        let accountsPayload = await loadAccountsBundle()

        if ((accountsPayload.directory ?? []).length === 0) {
          setSyncingDirectory(true)
          accountsPayload = await loadAccountsBundle(true)
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
        setSyncingDirectory(false)
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

  async function handleDirectorySync() {
    setSyncingDirectory(true)
    setFeedback(null)

    try {
      const payload = await loadAccountsBundle(true)
      setAccounts(payload.data ?? [])
      setDirectory(payload.directory ?? [])
      setFeedback({
        type: 'success',
        message: 'Diretorio sincronizado com a base atual do catalogo.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao sincronizar o diretorio',
      })
    } finally {
      setSyncingDirectory(false)
    }
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
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao criar conta')
      }

      const refreshPayload = await loadAccountsBundle()
      setAccounts(refreshPayload.data ?? [])
      setDirectory(refreshPayload.directory ?? [])

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
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">{t('accounts.label')}</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">
              {t('accounts.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-steel sm:text-base">
              {t('accounts.currentAdmin', { name: account?.nome ?? '...' })}
            </p>
          </div>
          <Link
            href="/catalogo"
            className="brand-chip rounded-full px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/40 hover:text-amber"
          >
            {t('common.backToCatalog')}
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="panel rounded-[32px] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber">{t('accounts.newAccess')}</p>
          {syncingDirectory ? (
            <div className="mt-4 rounded-2xl border border-amber/20 bg-amber/10 px-4 py-3 text-sm text-amber">
              {t('accounts.syncingBanner')}
            </div>
          ) : null}
          {!loading && lojas.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
              {t('accounts.emptyDirectory')}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              {t('accounts.name')}
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder={t('accounts.namePlaceholder')}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              {t('accounts.email')}
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                placeholder={t('accounts.emailPlaceholder')}
                required
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              {t('accounts.role')}
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
                <option value="cliente" className="bg-slate text-ink">{t('accounts.roleOptions.client')}</option>
                <option value="admin" className="bg-slate text-ink">{t('accounts.roleOptions.admin')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
              {t('accounts.store')}
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
                <option value="" className="bg-slate text-ink">{t('accounts.select')}</option>
                {lojas.map((loja) => (
                  <option key={loja} value={loja} className="bg-slate text-ink">
                    {loja}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{t('accounts.authTitle')}</p>
                <p className="mt-1 text-sm text-steel">
                  {t('accounts.authDescription')}
                </p>
              </div>
              <label className="brand-chip flex items-center gap-3 rounded-full px-4 py-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.provisionAuthUser}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      provisionAuthUser: event.target.checked,
                      temporaryPassword: event.target.checked ? current.temporaryPassword : '',
                    }))
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate text-amber focus:ring-amber"
                />
                <span>{t('accounts.provisionAuth')}</span>
              </label>
            </div>

            {form.provisionAuthUser ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-steel">
                  {t('accounts.temporaryPassword')}
                  <input
                    type="password"
                    value={form.temporaryPassword}
                    onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))}
                    className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none focus:border-amber/40 sm:text-sm"
                    placeholder={t('accounts.temporaryPasswordPlaceholder')}
                  />
                </label>

                <label className="brand-chip mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink sm:mt-0">
                  <input
                    type="checkbox"
                    checked={form.confirmEmail}
                    onChange={(event) => setForm((current) => ({ ...current, confirmEmail: event.target.checked }))}
                    className="h-4 w-4 rounded border-white/10 bg-slate text-amber focus:ring-amber"
                  />
                  <span>{t('accounts.confirmEmail')}</span>
                </label>
              </div>
            ) : null}
          </div>

          {form.role === 'cliente' && form.loja === 'Presente Net' ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">{t('accounts.enabledSuppliers')}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">{t('accounts.linkedClients')}</p>
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
              {saving ? t('accounts.saving') : t('accounts.createAccount')}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink"
            >
              {t('common.clear')}
            </button>
            <button
              type="button"
              onClick={handleDirectorySync}
              disabled={syncingDirectory}
              className="brand-chip rounded-full px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncingDirectory ? t('accounts.syncing') : t('accounts.syncingBase')}
            </button>
          </div>
        </form>

        <section className="panel rounded-[32px] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber">{t('accounts.registeredAccounts')}</p>
          {loading ? (
            <div className="mt-6 text-sm text-steel">{t('accounts.loadingList')}</div>
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
                      <span className="rounded-full bg-white/5 px-3 py-1 text-ink">{item.ativo ? t('accounts.statusActive') : t('accounts.statusInactive')}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {item.role === 'admin' ? (
                      <span className="rounded-full bg-white/5 px-3 py-1 text-ink">{t('accounts.totalAccess')}</span>
                    ) : item.access.scopeType === 'fornecedor_prefix' ? (
                      item.access.fornecedorPrefixes.map((prefix) => (
                        <span key={prefix} className="rounded-full bg-white/5 px-3 py-1 text-ink">
                          {t('accounts.supplierTag', { prefix })}
                        </span>
                      ))
                    ) : (
                      item.access.clienteCods.map((clienteCod) => (
                        <span key={clienteCod} className="rounded-full bg-white/5 px-3 py-1 text-ink">
                          {t('accounts.clientTag', { code: clienteCod })}
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
      <LoadingOverlay
        open={loading || saving || syncingDirectory}
        label={saving ? t('accounts.savingData') : syncingDirectory ? t('accounts.syncingDirectory') : t('accounts.loadingData')}
      />
    </main>
  )
}
