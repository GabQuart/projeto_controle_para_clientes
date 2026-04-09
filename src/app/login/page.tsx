'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'

type AuthMode = 'login' | 'primeiro_acesso'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const sessionResponse = await fetch('/api/auth/me')
        const sessionPayload = await sessionResponse.json()

        if (!sessionResponse.ok) {
          throw new Error(sessionPayload.error || 'Falha ao carregar sessao atual')
        }

        if (sessionPayload.account) {
          router.replace('/catalogo')
          return
        }

        if (sessionPayload.user?.email) {
          setEmail(sessionPayload.user.email)
          setFeedback({
            type: 'error',
            message: 'Seu e-mail autenticado ainda nao tem acesso vinculado. Fale com a M3rcadeo para liberar a conta.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Falha ao preparar o login',
        })
      } finally {
        setCheckingSession(false)
      }
    }

    bootstrap()
  }, [router])

  useEffect(() => {
    const callbackError = new URLSearchParams(window.location.search).get('error')

    if (callbackError === 'auth_callback') {
      setFeedback({
        type: 'error',
        message: 'A confirmacao anterior falhou. Use o login normal com e-mail e senha.',
      })
    }
  }, [])

  async function checkRegisteredAccount(targetEmail: string) {
    const response = await fetch(`/api/auth/account-status?email=${encodeURIComponent(targetEmail)}`)
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao validar a conta cadastrada')
    }

    if (!payload.data?.ativo) {
      throw new Error('Nao encontramos uma conta ativa com esse e-mail. Fale com a M3rcadeo para liberar seu acesso.')
    }

    return payload.data as { email: string; nome: string; role: 'admin' | 'cliente'; ativo: boolean }
  }

  async function syncAuthorizedSession() {
    const sessionResponse = await fetch('/api/auth/me')
    const sessionPayload = await sessionResponse.json()

    if (!sessionResponse.ok) {
      throw new Error(sessionPayload.error || 'Falha ao validar sessao atual')
    }

    if (!sessionPayload.account) {
      await supabase.auth.signOut()
      throw new Error('Sua autenticacao foi criada, mas o e-mail ainda nao possui conta interna liberada.')
    }

    router.push('/catalogo')
  }

  async function handleLogin() {
    setSubmitting(true)
    setFeedback(null)

    try {
      await checkRegisteredAccount(email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      await syncAuthorizedSession()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao entrar no sistema',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFirstAccess() {
    setSubmitting(true)
    setFeedback(null)

    try {
      if (password.length < 6) {
        throw new Error('Use uma senha com pelo menos 6 caracteres.')
      }

      if (password !== confirmPassword) {
        throw new Error('A confirmacao da senha precisa ser igual a senha.')
      }

      await checkRegisteredAccount(email)

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (!data.session) {
        setFeedback({
          type: 'success',
          message: 'Conta de autenticacao criada. Se o Supabase pedir confirmacao por e-mail, confirme e depois faca login normalmente.',
        })
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        return
      }

      await syncAuthorizedSession()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao ativar o primeiro acesso',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isFirstAccess = mode === 'primeiro_acesso'

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:px-8 lg:py-12">
      <section className="order-2 flex-1 rounded-[32px] panel p-5 sm:p-8 lg:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">M3rcadeo Access Layer</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
          Login normal com e-mail e senha, validado pela conta da operacao.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-steel sm:text-base lg:text-lg">
          O admin cadastra o acesso interno e o usuario entra com senha normal. No primeiro acesso, ele ativa a autenticacao
          com o mesmo e-mail autorizado.
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Login direto</p>
            <p className="mt-2 text-sm text-steel">Nada de magic link: o usuario entra com e-mail e senha normal.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Primeiro acesso</p>
            <p className="mt-2 text-sm text-steel">Se a conta ja foi cadastrada pelo admin, o proprio cliente define a senha inicial.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Conta interna</p>
            <p className="mt-2 text-sm text-steel">Mesmo autenticado no Supabase, o acesso so abre se o e-mail existir nas contas do sistema.</p>
          </div>
        </div>
      </section>

      <section className="order-1 w-full max-w-xl rounded-[32px] panel p-5 sm:p-8 lg:order-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">
          {isFirstAccess ? 'Primeiro acesso' : 'Login'}
        </p>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
          {isFirstAccess ? 'Ative sua conta com uma senha' : 'Entre com seu e-mail e senha'}
        </h2>
        <p className="mt-3 text-sm text-steel">
          {isFirstAccess
            ? 'Use exatamente o e-mail que a M3rcadeo cadastrou para voce.'
            : 'Se ainda nao definiu senha, use a aba de primeiro acesso.'}
        </p>

        <div className="mt-6 flex gap-2 rounded-full border border-white/10 bg-night/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setFeedback(null)
            }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !isFirstAccess ? 'bg-cobalt text-white' : 'text-steel hover:text-ink'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('primeiro_acesso')
              setFeedback(null)
            }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isFirstAccess ? 'bg-cobalt text-white' : 'text-steel hover:text-ink'
            }`}
          >
            Primeiro acesso
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-steel">
            E-mail autorizado
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none placeholder:text-steel focus:border-amber/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-steel">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none placeholder:text-steel focus:border-amber/40"
            />
          </label>

          {isFirstAccess ? (
            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-steel">
              Confirmar senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a senha"
                className="brand-chip rounded-2xl px-4 py-3 text-base text-ink outline-none placeholder:text-steel focus:border-amber/40"
              />
            </label>
          ) : null}

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                feedback.type === 'success' ? 'border border-pine/30 bg-pine/10 text-pine' : 'border border-clay/30 bg-clay/10 text-clay'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={isFirstAccess ? handleFirstAccess : handleLogin}
            disabled={submitting || checkingSession || !email || !password || (isFirstAccess && !confirmPassword)}
            className="w-full rounded-full bg-cobalt px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Processando...' : isFirstAccess ? 'Criar senha e entrar' : 'Entrar no sistema'}
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
