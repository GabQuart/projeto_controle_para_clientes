import { NextResponse } from 'next/server'
import { getAuthenticatedAccount } from '@/lib/services/account.service'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!user?.email) {
      return NextResponse.json(
        { user: null, account: null },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      )
    }

    const account = await getAuthenticatedAccount()

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
        account,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar sessao'
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
