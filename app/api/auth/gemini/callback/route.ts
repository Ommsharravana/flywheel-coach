import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/byos/encryption';
import { GeminiProvider } from '@/lib/byos/gemini-provider';
import type { GeminiOAuthCredentials } from '@/lib/byos/types';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// GET /api/auth/gemini/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=missing_params`);
    }

    // Decode and verify state
    let stateData: { userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=invalid_state`);
    }

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=expired`);
    }

    // Verify the user is still logged in and matches the state
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=auth_mismatch`);
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_GEMINI_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_GEMINI_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/gemini/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=not_configured`);
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Build credentials object
    const credentials: GeminiOAuthCredentials = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_uri: GOOGLE_TOKEN_URL,
      client_id: clientId,
      client_secret: clientSecret,
      expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    };

    // Validate credentials by making a test API call
    const geminiProvider = new GeminiProvider(credentials);
    const isValid = await geminiProvider.validateCredentials();

    if (!isValid) {
      console.error('Gemini OAuth credentials failed validation');
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=invalid_credentials`);
    }

    // Encrypt and store credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any)
      .from('provider_credentials')
      .upsert(
        {
          user_id: user.id,
          provider: 'gemini',
          credentials_encrypted: encryptedCredentials,
          credential_type: 'oauth_json',
          is_valid: true,
          last_validated_at: new Date().toISOString(),
          expires_at: credentials.expiry,
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (dbError) {
      console.error('Error storing credentials:', dbError);
      return NextResponse.redirect(`${baseUrl}/settings?gemini_error=storage_failed`);
    }

    // Success! Redirect back to settings
    return NextResponse.redirect(`${baseUrl}/settings?gemini_success=true`);
  } catch (error) {
    console.error('Gemini OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/settings?gemini_error=internal`);
  }
}
