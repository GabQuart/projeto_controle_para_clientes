'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoadingOverlay } from '@/components/LoadingOverlay'

type AuthMode = 'login' | 'primeiro_acesso'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function getNextPath() {
    if (typeof window === 'undefined') {
      return '/catalogo'
    }

    const target = new URLSearchParams(window.location.search).get('next')
    return target && target.startsWith('/') ? target : '/catalogo'
  }

  useEffect(() => {
    const callbackError = new URLSearchParams(window.location.search).get('error')

    if (callbackError === 'auth_callback') {
      setFeedback({
        type: 'error',
        message: 'A confirmacao anterior falhou. Use o login normal com e-mail e senha.',
      })
    }
  }, [])

  async function handleLogin() {
    setSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao entrar no sistema')
      }

      router.replace(getNextPath())
      router.refresh()
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

      const response = await fetch('/api/auth/primeiro-acesso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao ativar o primeiro acesso')
      }

      router.replace(getNextPath())
      router.refresh()
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
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Acesso</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
          Sistema de controle de produtos e abertura de chamados.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-steel sm:text-base lg:text-lg">
          Consulte catalogos por loja, acompanhe status de produtos e variacoes e envie solicitacoes operacionais de forma rapida.
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Catalogo</p>
            <p className="mt-2 text-sm text-steel">Visualize produtos, variacoes e status por loja.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Chamados</p>
            <p className="mt-2 text-sm text-steel">Abra ativacoes e inativacoes em poucos cliques.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Historico</p>
            <p className="mt-2 text-sm text-steel">Acompanhe a fila e o registro das solicitacoes abertas.</p>
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
          {isFirstAccess ? 'Use o e-mail liberado para sua conta.' : 'Se ainda nao tem senha, use a aba de primeiro acesso.'}
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
            disabled={submitting || !email || !password || (isFirstAccess && !confirmPassword)}
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
      <LoadingOverlay
        open={submitting}
        label={isFirstAccess ? 'Criando acesso...' : 'Entrando no sistema...'}
      />
    </main>
  )
}
