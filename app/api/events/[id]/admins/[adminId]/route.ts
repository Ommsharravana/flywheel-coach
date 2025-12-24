import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

interface RouteParams {
  params: Promise<{ id: string; adminId: string }>;
}

// DELETE /api/events/[id]/admins/[adminId] - Remove event admin
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, adminId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can manage this event
    const { isAdmin, role } = await checkEventAdminAccess(user.id, id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const isSuperAdmin = role === 'superadmin';

    // Get the admin record to check permissions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminRecord, error: fetchError } = await (supabase as any)
      .from('event_admins')
      .select('id, user_id, role')
      .eq('id', adminId)
      .eq('event_id', id)
      .single();

    if (fetchError || !adminRecord) {
      return NextResponse.json({ error: 'Admin record not found' }, { status: 404 });
    }

    // Prevent removing yourself
    if (adminRecord.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself as admin' }, { status: 400 });
    }

    // Only superadmins can remove other admins with 'admin' role
    if (adminRecord.role === 'admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only superadmins can remove admin role' }, { status: 403 });
    }

    // Delete the admin record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('event_admins')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      console.error('Error removing event admin:', deleteError);
      return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 });
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'remove_event_admin',
      entity_type: 'event_admin',
      entity_id: adminId,
      details: {
        event_id: id,
        removed_user_id: adminRecord.user_id,
        removed_role: adminRecord.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]/admins/[adminId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
