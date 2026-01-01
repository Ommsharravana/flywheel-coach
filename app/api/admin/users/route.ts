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
// Uses batch fetching to overcome Supabase's 1000 row default limit
export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const BATCH_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allUsers: any[] = [];
  let offset = 0;
  let totalCount = 0;
  let hasMore = true;

  // Fetch users in batches to overcome the 1000 row limit
  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error } = await (supabase as any).rpc('get_all_users_admin', {
      caller_user_id: user.id,
      page_offset: offset,
      page_limit: BATCH_SIZE
    });

    if (error) {
      // Handle unauthorized error from RPC
      if (error.message?.includes('Unauthorized') || error.message?.includes('superadmin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      // Get total count from first row (all rows have same total_count)
      if (offset === 0 && batch[0]?.total_count) {
        totalCount = Number(batch[0].total_count);
      }

      allUsers = [...allUsers, ...batch];
      offset += BATCH_SIZE;

      // Stop if we've fetched all users
      if (batch.length < BATCH_SIZE || allUsers.length >= totalCount) {
        hasMore = false;
      }
    }
  }

  // Remove total_count from individual rows (it was just for pagination)
  const users = allUsers.map(({ total_count, ...user }) => user);

  return NextResponse.json({ users, totalCount });
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
