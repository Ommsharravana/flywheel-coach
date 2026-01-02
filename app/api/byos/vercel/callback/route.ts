import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeVercelCode,
  storeVercelCredentials,
} from '@/lib/byos/vercel-provider';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const configurationId = searchParams.get('configurationId');
    const teamId = searchParams.get('teamId');
    const errorParam = searchParams.get('error');

    // Handle OAuth errors
    if (errorParam) {
      console.error('Vercel OAuth error:', errorParam);
      return NextResponse.redirect(
        new URL(`/byos?error=${encodeURIComponent(errorParam)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/byos?error=No authorization code received', request.url)
      );
    }

    // Verify user is logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/login?redirect=/byos', request.url)
      );
    }

    // Build callback URL (must match what was sent in authorize request)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/byos/vercel/callback`;

    // Exchange code for token
    const tokens = await exchangeVercelCode(code, redirectUri);

    // Store tokens in database
    await storeVercelCredentials(
      user.id,
      tokens.access_token,
      teamId || tokens.team_id,
      undefined // Team name fetched later
    );

    // Log configuration for debugging
    if (configurationId) {
      console.log(`Vercel connected with configuration: ${configurationId}`);
    }

    // Redirect back to BYOS page with success
    return NextResponse.redirect(
      new URL('/byos?connected=vercel', request.url)
    );
  } catch (error) {
    console.error('Vercel callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    return NextResponse.redirect(
      new URL(`/byos?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
