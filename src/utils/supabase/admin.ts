import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from '@/lib/env'
import { fetchWithTimeout } from '@/utils/supabase/fetch-with-timeout'

export function createAdminClient() {
  const { url } = getSupabasePublicEnv()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  return createClient(url, serviceRoleKey, {
    global: { fetch: fetchWithTimeout },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
