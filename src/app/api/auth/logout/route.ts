import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/utils/supabase/route-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { supabase, json } = createRouteHandlerClient(request)
    const { error } = await supabase.auth.signOut()

    if (error) {
      return json({ error: error.message }, { status: 400 })
    }

    return json({ data: { success: true } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao encerrar a sessao'
    return createRouteHandlerClient(request).json({ error: message }, { status: 500 })
  }
}
