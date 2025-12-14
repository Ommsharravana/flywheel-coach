import { createBrowserClient } from '@supabase/ssr'

// Placeholder values for build time - will be replaced with actual values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Using untyped client until database schema is finalized
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function isSupabaseConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined
  )
}
