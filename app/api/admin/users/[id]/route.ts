import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ProfileRole {
  role: string;
}

interface TargetUserRole {
  role: string;
}

interface TargetUserWithEmail {
  role: string;
  email: string | null;
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

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  if (!(await isSuperAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  if (!(await isSuperAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { name, role } = body;

  // Check if target user is superadmin
  const { data: targetUserData } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();

  const targetUser = targetUserData as unknown as TargetUserRole | null;

  if (targetUser?.role === 'superadmin') {
    return NextResponse.json(
      { error: 'Cannot modify superadmin users' },
      { status: 400 }
    );
  }

  // Prevent creating new superadmins through this route
  if (role === 'superadmin') {
    return NextResponse.json(
      { error: 'Cannot set superadmin role' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error } = await (supabase as any)
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (adminUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: adminUser.id,
      action: 'update_user',
      entity_type: 'user',
      entity_id: id,
      details: { changes: updateData },
    });
  }

  return NextResponse.json({ user });
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  if (!(await isSuperAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Check if target user is superadmin
  const { data: targetUserData } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', id)
    .single();

  const targetUser = targetUserData as unknown as TargetUserWithEmail | null;

  if (targetUser?.role === 'superadmin') {
    return NextResponse.json(
      { error: 'Cannot delete superadmin users' },
      { status: 400 }
    );
  }

  // Delete user's cycles first (cascade should handle this, but being explicit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('cycles').delete().eq('user_id', id);

  // Delete the user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any)
    .from('users')
    .delete()
    .eq('id', id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Try to delete auth user (may fail with anon key)
  try {
    await supabase.auth.admin.deleteUser(id);
  } catch {
    // Ignore auth deletion errors
  }

  // Log the action
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (adminUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: adminUser.id,
      action: 'delete_user',
      entity_type: 'user',
      entity_id: id,
      details: { email: targetUser?.email },
    });
  }

  return NextResponse.json({ success: true });
}
