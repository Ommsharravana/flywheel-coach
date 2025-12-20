import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { encrypt, isEncryptionConfigured } from '@/lib/byos/encryption'

// Placeholder values for build time - will be replaced with actual values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && data.session) {
      // Store Google OAuth tokens for Gemini API access
      // This enables AI Coach powered by user's own Gemini subscription
      if (data.session.provider_token && isEncryptionConfigured()) {
        try {
          const oauthCredentials = {
            access_token: data.session.provider_token,
            refresh_token: data.session.provider_refresh_token || null,
            token_uri: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/generative-language.retriever'],
          }

          const encrypted = encrypt(JSON.stringify(oauthCredentials))

          // Upsert Gemini credentials (update if exists, insert if not)
          await supabase
            .from('provider_credentials')
            .upsert({
              user_id: data.user.id,
              provider: 'gemini',
              credentials_encrypted: encrypted,
              credential_type: 'oauth_json',
              is_valid: true,
              last_validated_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            }, {
              onConflict: 'user_id,provider',
            })
        } catch (err) {
          console.error('Failed to store Gemini credentials:', err)
        }
      }

      // Check if user has institution set
      const { data: profile } = await supabase
        .from('users')
        .select('institution_id')
        .eq('id', data.user.id)
        .single()

      // If no institution, redirect to institution selection
      if (!profile?.institution_id) {
        return NextResponse.redirect(`${origin}/select-institution`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
