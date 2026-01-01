import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Claude OAuth configuration
// Using Claude Code's OAuth flow for BYOS (Bring Your Own Subscription)
// Scopes: user:inference (use Claude API) and user:profile (get user info)
const CLAUDE_SCOPES = ['user:inference', 'user:profile'];
const CLAUDE_AUTH_URL = 'https://console.anthropic.com/oauth/authorize';

// GET /api/auth/claude - Initiate OAuth flow for Claude
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check required env vars
    const clientId = process.env.CLAUDE_OAUTH_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Claude OAuth not configured. Contact administrator.' },
        { status: 500 }
      );
    }

    // Build the redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/claude/callback`;

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Create state parameter with user ID and code verifier for security
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      codeVerifier, // Store for callback
    })).toString('base64url');

    // Build Claude OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: CLAUDE_SCOPES.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${CLAUDE_AUTH_URL}?${params.toString()}`;

    // Return the auth URL for the client to redirect to
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Claude OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
