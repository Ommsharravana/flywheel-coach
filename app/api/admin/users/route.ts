import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Check if current user is superadmin using RPC (bypasses RLS)
async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRole } = await (supabase as any).rpc('get_current_user_role');
  return userRole === 'superadmin';
}

// GET /api/admin/users - List all users
export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use RPC to get all users (handles auth check internally, bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, error } = await (supabase as any).rpc('get_all_users_admin', {
    caller_user_id: user.id
  });

  if (error) {
    // Handle unauthorized error from RPC
    if (error.message?.includes('Unauthorized') || error.message?.includes('superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
  const supabase = await createClient();

  if (!(await isSuperAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Prevent creating superadmin users through API
  if (role === 'superadmin') {
    return NextResponse.json(
      { error: 'Cannot create superadmin users' },
      { status: 400 }
    );
  }

  // Create auth user using Supabase Admin API
  // Note: In production, you'd use the service role key for this
  // For now, we'll create a user profile entry
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    // If auth creation fails, try to just create profile
    // This might happen if using anon key
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Update the user profile with additional info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error: profileError } = await (supabase as any)
    .from('users')
    .update({ name, role: role || 'learner' })
    .eq('id', authData.user.id)
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Log the action
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (adminUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: adminUser.id,
      action: 'create_user',
      entity_type: 'user',
      entity_id: user.id,
      details: { email, role: role || 'learner' },
    });
  }

  return NextResponse.json({ user }, { status: 201 });
}
