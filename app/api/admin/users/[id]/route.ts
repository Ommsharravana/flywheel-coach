import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface TargetUserWithEmail {
  role: string;
  email: string | null;
}

// Check if current user is superadmin (uses RPC to bypass RLS)
async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: isSuperadmin } = await (supabase as any).rpc('check_is_superadmin');
  return isSuperadmin === true;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use RPC to get user (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error } = await (supabase as any).rpc('get_user_by_id_admin', { target_user_id: id });

    const user = (userData as unknown[])?.[0] || null;
    if (error || !user) {
      return NextResponse.json({ error: error?.message || 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('GET /api/admin/users/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, role } = body;

    // Use RPC to update user (bypasses RLS, includes all validation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error } = await (supabase as any).rpc('update_user_admin', {
      target_user_id: id,
      new_name: name || null,
      new_role: role || null,
    });

    if (error) {
      // Handle specific error messages from the RPC
      const errorMsg = error.message || 'Failed to update user';
      if (errorMsg.includes('superadmin')) {
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
      if (errorMsg.includes('Unauthorized')) {
        return NextResponse.json({ error: errorMsg }, { status: 403 });
      }
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const user = (userData as unknown[])?.[0] || null;

    // Log the action (best effort, don't fail if this doesn't work)
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (adminUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('admin_activity_logs').insert({
          admin_id: adminUser.id,
          action: 'update_user',
          entity_type: 'user',
          entity_id: id,
          details: { changes: { name, role } },
        });
      }
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('PUT /api/admin/users/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if target user is superadmin using RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetUserData } = await (supabase as any).rpc('get_user_by_id_admin', { target_user_id: id });
    const targetUser = (targetUserData as unknown[])?.[0] as TargetUserWithEmail | null;

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
    try {
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
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/users/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
