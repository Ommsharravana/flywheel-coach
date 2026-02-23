import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Test accounts for development - DO NOT USE IN PRODUCTION
// Schema: role = permission level, user_category = identity (learner/senior_learner)
// Note: is_senior_learner column was dropped in migration 056, replaced by user_category
// Note: judges are assigned via track_judges table, not a user column
const TEST_ACCOUNTS = {
  superadmin: {
    email: 'test.superadmin@jkkn.local',
    name: 'Test Superadmin',
    role: 'superadmin',
    user_category: 'learner',
  },
  admin: {
    email: 'test.admin@jkkn.local',
    name: 'Test Admin',
    role: 'event_admin',
    user_category: 'learner',
  },
  builder: {
    email: 'test.builder@jkkn.local',
    name: 'Test Builder',
    role: 'builder',
    user_category: 'learner',
  },
  senior: {
    email: 'test.senior@jkkn.local',
    name: 'Test Senior Learner',
    role: 'builder',
    user_category: 'senior_learner',
  },
  judge: {
    email: 'test.judge@jkkn.local',
    name: 'Test Judge',
    role: 'builder',
    user_category: 'learner',
  },
} as const;

type TestAccountKey = keyof typeof TEST_ACCOUNTS;

/**
 * DEV-ONLY: Sign in as a test user
 * This route only works in development mode
 *
 * Fix: Instead of returning a magic link (which uses implicit flow and breaks
 * the server-side auth callback), we now exchange the token server-side
 * and set auth cookies directly, then redirect to dashboard.
 */
export async function POST(request: NextRequest) {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev login is only available in development mode' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { account } = body as { account: TestAccountKey };

    if (!account || !TEST_ACCOUNTS[account]) {
      return NextResponse.json(
        {
          error: 'Invalid account type',
          available: Object.keys(TEST_ACCOUNTS),
        },
        { status: 400 }
      );
    }

    const testAccount = TEST_ACCOUNTS[account];

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if test user exists in auth.users
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find(u => u.email === testAccount.email);

    // Create test user if doesn't exist
    if (!authUser) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testAccount.email,
        email_confirm: true,
        user_metadata: {
          name: testAccount.name,
          is_test_account: true,
        },
      });

      if (createError) {
        console.error('Error creating test user:', createError);
        return NextResponse.json(
          { error: 'Failed to create test user', details: createError.message },
          { status: 500 }
        );
      }

      authUser = newUser.user;

      // Create user profile in public.users table
      const { error: profileError } = await adminClient
        .from('users')
        .upsert({
          id: authUser.id,
          email: testAccount.email,
          name: testAccount.name,
          role: testAccount.role,
          is_senior_learner: 'is_senior_learner' in testAccount ? testAccount.is_senior_learner : false,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    } else {
      // Ensure profile exists and role is up to date for existing users
      const { error: profileError } = await adminClient
        .from('users')
        .upsert({
          id: authUser.id,
          email: testAccount.email,
          name: testAccount.name,
          role: testAccount.role,
          is_senior_learner: 'is_senior_learner' in testAccount ? testAccount.is_senior_learner : false,
        });

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      }
    }

    // Generate a magic link to get the token hash
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: testAccount.email,
    });

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate login link', details: linkError?.message },
        { status: 500 }
      );
    }

    // Extract the token hash from the generated link
    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      return NextResponse.json(
        { error: 'Failed to extract token hash' },
        { status: 500 }
      );
    }

    // Exchange the token hash for a session server-side using SSR client
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore cookie setting errors in server components
          }
        },
      },
    });

    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (verifyError || !sessionData.session) {
      console.error('Error verifying OTP:', verifyError);
      return NextResponse.json(
        { error: 'Failed to create session', details: verifyError?.message },
        { status: 500 }
      );
    }

    // Session cookies are now set via the SSR client
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      message: `Logged in as ${testAccount.name}`,
      redirectUrl: `${origin}/dashboard`,
      account: {
        email: testAccount.email,
        name: testAccount.name,
        role: testAccount.role,
      },
    });

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { error: 'Failed to process dev login' },
      { status: 500 }
    );
  }
}

/**
 * GET: List available test accounts
 */
export async function GET() {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev login is only available in development mode' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    accounts: Object.entries(TEST_ACCOUNTS).map(([key, account]) => ({
      key,
      email: account.email,
      name: account.name,
      role: account.role,
    })),
    usage: 'POST /api/auth/dev-login with { "account": "superadmin" | "admin" | "builder" | "senior" | "judge" }',
  });
}
