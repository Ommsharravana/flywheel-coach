import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeGitHubCode,
  getGitHubUser,
  storeGitHubCredentials,
} from '@/lib/byos/github-provider';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error, errorDescription);
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

    // Exchange code for token
    const tokens = await exchangeGitHubCode(code);

    // Get GitHub user info
    const githubUser = await getGitHubUser(tokens.access_token);

    // Store tokens in database
    await storeGitHubCredentials(
      user.id,
      tokens.access_token,
      githubUser.login
    );

    // Redirect back to BYOS page with success
    return NextResponse.redirect(
      new URL('/byos?connected=github', request.url)
    );
  } catch (error) {
    console.error('GitHub callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    return NextResponse.redirect(
      new URL(`/byos?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
