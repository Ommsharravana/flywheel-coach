import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ProfileRole {
  role: string;
}

// Check if current user is superadmin
async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = profileData as unknown as ProfileRole | null;
  return profile?.role === 'superadmin';
}

// GET /api/admin/users - List all users
export async function GET() {
  const supabase = await createClient();

  if (!(await isSuperAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
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
