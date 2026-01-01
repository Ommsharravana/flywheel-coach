import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/byos';

const CLAUDE_TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';

// GET /api/auth/claude/callback - Handle OAuth callback from Claude
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Claude OAuth error:', error, errorDescription);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        `${baseUrl}/settings?error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=Missing%20authorization%20code`
      );
    }

    // Decode state
    let stateData: { userId: string; timestamp: number; codeVerifier: string };
    try {
      stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=Invalid%20state`
      );
    }

    // Verify state timestamp (10 minute expiry)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=Authorization%20expired`
      );
    }

    // Verify user is logged in and matches state
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=User%20mismatch`
      );
    }

    // Exchange code for tokens
    const clientId = process.env.CLAUDE_OAUTH_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=OAuth%20not%20configured`
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/claude/callback`;

    const tokenResponse = await fetch(CLAUDE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: stateData.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Claude token exchange failed:', errorText);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=${encodeURIComponent('Failed to exchange authorization code')}`
      );
    }

    const tokens = await tokenResponse.json();

    // Store credentials
    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_type: tokens.token_type || 'Bearer',
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      scope: tokens.scope,
    };

    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Calculate expiry date for database
    const expiresAt = credentials.expires_at
      ? new Date(credentials.expires_at * 1000).toISOString()
      : null;

    // Upsert credentials to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('provider_credentials')
      .upsert(
        {
          user_id: user.id,
          provider: 'claude',
          credentials_encrypted: encryptedCredentials,
          credential_type: 'oauth_json',
          is_valid: true,
          last_validated_at: new Date().toISOString(),
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (upsertError) {
      console.error('Failed to store Claude credentials:', upsertError);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=${encodeURIComponent('Failed to store credentials')}`
      );
    }

    // Success - redirect back to settings
    return NextResponse.redirect(`${baseUrl}/settings?claude=connected`);
  } catch (error) {
    console.error('Claude OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent('Authentication failed')}`
    );
  }
}
