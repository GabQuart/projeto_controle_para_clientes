import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/env'

export function createRouteHandlerClient(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicEnv()
  let cookieCarrier = NextResponse.json({})

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieCarrier.cookies.set(name, value, options)
        })
      },
    },
  })

  function json(body: unknown, init?: ResponseInit) {
    const response = NextResponse.json(body, {
      ...init,
      headers: {
        'Cache-Control': 'no-store',
        ...(init?.headers ?? {}),
      },
    })

    cookieCarrier.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })

    return response
  }

  return {
    supabase,
    json,
  }
}
