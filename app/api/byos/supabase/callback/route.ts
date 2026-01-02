import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeSupabaseCode,
  storeSupabaseCredentials,
  listSupabaseProjects,
} from '@/lib/byos/supabase-provider';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Supabase OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/byos?error=${encodeURIComponent(errorDescription || error)}`, request.url)
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
    const redirectUri = `${baseUrl}/api/byos/supabase/callback`;

    // Exchange code for tokens
    const tokens = await exchangeSupabaseCode(code, redirectUri);

    // Store tokens in database
    await storeSupabaseCredentials(
      user.id,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    // Verify connection works by fetching projects
    try {
      const projects = await listSupabaseProjects(tokens.access_token);
      console.log(`Connected to Supabase: ${projects.length} projects available`);
    } catch (projectError) {
      console.warn('Could not verify Supabase connection:', projectError);
      // Continue anyway, tokens are stored
    }

    // Redirect back to BYOS page with success
    return NextResponse.redirect(
      new URL('/byos?connected=supabase', request.url)
    );
  } catch (error) {
    console.error('Supabase callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    return NextResponse.redirect(
      new URL(`/byos?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
