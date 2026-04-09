'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const supabase = useMemo(() => createSupabaseClient(), [])

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
            message: 'Seu e-mail autenticado ainda nao tem acesso vinculado. Peca para a M3rcadeo cadastrar sua conta.',
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
        message: 'Nao foi possivel confirmar o link de acesso. Solicite um novo e-mail e tente novamente.',
      })
    }
  }, [])

  async function handleMagicLink() {
    setSubmitting(true)
    setFeedback(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/catalogo`,
        },
      })

      if (error) {
        throw error
      }

      setFeedback({
        type: 'success',
        message: 'Link de acesso enviado. Abra o e-mail e volte para o sistema pelo botao do Supabase.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao enviar o link de acesso',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:px-8 lg:py-12">
      <section className="order-2 flex-1 rounded-[32px] panel p-5 sm:p-8 lg:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">M3rcadeo Access Layer</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
          Autenticacao por e-mail com sessao segura e acesso recortado por conta.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-steel sm:text-base lg:text-lg">
          Agora o login passa pelo Supabase e a liberacao continua respeitando o cadastro interno da M3rcadeo para admin e clientes.
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Supabase Auth</p>
            <p className="mt-2 text-sm text-steel">Magic link por e-mail com sessao renovada automaticamente no middleware.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Conta vinculada</p>
            <p className="mt-2 text-sm text-steel">Mesmo autenticado, o usuario so entra se o e-mail estiver cadastrado nas contas da operacao.</p>
          </div>
          <div className="brand-chip rounded-3xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Cadastro governado</p>
            <p className="mt-2 text-sm text-steel">As contas sao criadas por admin e relacionam lojas, clientes e fornecedores direto no banco.</p>
          </div>
        </div>
      </section>

      <section className="order-1 w-full max-w-xl rounded-[32px] panel p-5 sm:p-8 lg:order-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber">Login com e-mail</p>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">Receba um link magico do Supabase</h2>
        <p className="mt-3 text-sm text-steel">
          Use o mesmo e-mail cadastrado pela M3rcadeo. O Supabase autentica e o sistema confere no banco se esse acesso existe.
        </p>

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
            onClick={handleMagicLink}
            disabled={submitting || checkingSession || !email}
            className="w-full rounded-full bg-cobalt px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#418dff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Enviando link...' : 'Receber link de acesso'}
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
