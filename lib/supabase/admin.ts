import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * Admin Supabase client that bypasses RLS
 * Use ONLY for public read-only APIs like leaderboards
 * NEVER expose user-specific or sensitive data through this client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
