import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Gemini API OAuth scopes - peruserquota allows using user's personal Gemini quota
const GEMINI_SCOPES = [
  'https://www.googleapis.com/auth/generative-language.peruserquota',
];

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// GET /api/auth/gemini - Initiate OAuth flow for Gemini
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check required env vars
    const clientId = process.env.GOOGLE_GEMINI_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Gemini OAuth not configured. Contact administrator.' },
        { status: 500 }
      );
    }

    // Build the redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/gemini/callback`;

    // Create state parameter with user ID for security
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64');

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GEMINI_SCOPES.join(' '),
      access_type: 'offline', // Get refresh token
      prompt: 'consent', // Always show consent to get refresh token
      state,
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

    // Return the auth URL for the client to redirect to
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Gemini OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
