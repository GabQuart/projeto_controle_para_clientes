import { NextRequest } from 'next/server'
import { getPublicAccountStatusByEmail } from '@/lib/services/account.service'
import { compactText } from '@/lib/utils/format'
import { createAdminClient } from '@/utils/supabase/admin'
import { createRouteHandlerClient } from '@/utils/supabase/route-handler'

export const dynamic = 'force-dynamic'

function normalizeEmail(email: string) {
  return compactText(email).toLowerCase()
}

function mapFirstAccessError(message: string) {
  const normalizedMessage = compactText(message).toLowerCase()

  if (normalizedMessage.includes('already been registered') || normalizedMessage.includes('already registered')) {
    return 'Esse e-mail ja possui login criado. Use a aba de login normal.'
  }

  return message
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const email = normalizeEmail(String(payload?.email ?? ''))
    const password = String(payload?.password ?? '')
    const confirmPassword = String(payload?.confirmPassword ?? '')

    if (!email || !password || !confirmPassword) {
      return createRouteHandlerClient(request).json({ error: 'Preencha e-mail, senha e confirmacao.' }, { status: 400 })
    }

    if (password.length < 6) {
      return createRouteHandlerClient(request).json({ error: 'Use uma senha com pelo menos 6 caracteres.' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return createRouteHandlerClient(request).json({ error: 'A confirmacao da senha precisa ser igual a senha.' }, { status: 400 })
    }

    const account = await getPublicAccountStatusByEmail(email)

    if (!account?.ativo) {
      return createRouteHandlerClient(request).json(
        { error: 'Nao encontramos uma conta ativa com esse e-mail. Fale com a M3rcadeo para liberar seu acesso.' },
        { status: 403 },
      )
    }

    const adminSupabase = createAdminClient()
    const { data: authUserData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: account.nome,
      },
      app_metadata: {
        role: account.role,
      },
    })

    if (authError) {
      return createRouteHandlerClient(request).json({ error: mapFirstAccessError(authError.message) }, { status: 400 })
    }

    const { supabase, json } = createRouteHandlerClient(request)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      await adminSupabase.auth.admin.deleteUser(authUserData.user.id)
      return json({ error: signInError.message }, { status: 400 })
    }

    return json({
      data: {
        email,
        role: account.role,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao ativar o primeiro acesso'
    return createRouteHandlerClient(request).json({ error: message }, { status: 500 })
  }
}
