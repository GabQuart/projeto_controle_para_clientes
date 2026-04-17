import { NextRequest } from 'next/server'
import { getPublicAccountStatusByEmail } from '@/lib/services/account.service'
import { compactText } from '@/lib/utils/format'
import { createRouteHandlerClient } from '@/utils/supabase/route-handler'

export const dynamic = 'force-dynamic'

function normalizeEmail(email: string) {
  return compactText(email).toLowerCase()
}

function mapLoginError(message: string) {
  const normalizedMessage = compactText(message).toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'E-mail ou senha invalidos.'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'O e-mail ainda nao foi confirmado no Supabase.'
  }

  return message
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const email = normalizeEmail(String(payload?.email ?? ''))
    const password = String(payload?.password ?? '')

    if (!email || !password) {
      return createRouteHandlerClient(request).json({ error: 'Informe e-mail e senha para entrar.' }, { status: 400 })
    }

    let account = null
    let lastLoginError: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        account = await getPublicAccountStatusByEmail(email)
        break
      } catch (err) {
        lastLoginError = err
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }

    if (lastLoginError && account === null) {
      const isNetwork = lastLoginError instanceof TypeError && lastLoginError.message.toLowerCase().includes('fetch')
      const msg = isNetwork
        ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
        : lastLoginError instanceof Error ? lastLoginError.message : 'Falha ao verificar conta.'
      return createRouteHandlerClient(request).json({ error: msg }, { status: 503 })
    }

    if (!account?.ativo) {
      return createRouteHandlerClient(request).json(
        { error: 'Nao encontramos uma conta ativa com esse e-mail. Fale com a M3rcadeo para liberar seu acesso.' },
        { status: 403 },
      )
    }

    const { supabase, json } = createRouteHandlerClient(request)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return json({ error: mapLoginError(error.message) }, { status: 401 })
    }

    return json({
      data: {
        email,
        role: account.role,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o login'
    return createRouteHandlerClient(request).json({ error: message }, { status: 500 })
  }
}
