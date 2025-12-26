import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id]/admins - List event admins
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can manage this event
    const { isAdmin } = await checkEventAdminAccess(user.id, id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all admins for this event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins, error } = await (supabase as any)
      .from('event_admins')
      .select(`
        id,
        user_id,
        role,
        created_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching event admins:', error);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    // Transform the response
    const transformedAdmins = (admins || []).map((admin: {
      id: string;
      user_id: string;
      role: string;
      created_at: string;
      users: { id: string; name: string; email: string } | null;
    }) => ({
      id: admin.id,
      user_id: admin.user_id,
      role: admin.role,
      created_at: admin.created_at,
      user: admin.users || { name: 'Unknown', email: '' },
    }));

    return NextResponse.json(transformedAdmins);
  } catch (error) {
    console.error('Error in GET /api/events/[id]/admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events/[id]/admins - Add event admin
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can manage this event
    const { isAdmin, role: userRole } = await checkEventAdminAccess(user.id, id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const isSuperAdmin = userRole === 'superadmin';

    const body = await request.json();
    const { email, role = 'admin' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only superadmins can add other admins with 'admin' role
    if (role === 'admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only superadmins can add admin role' }, { status: 403 });
    }

    // Find user by email using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userError } = await (supabase as any).rpc('get_user_by_email_admin', {
      target_email: email.toLowerCase(),
    });

    const targetUser = (userData as { id: string; name: string; email: string }[] | null)?.[0];
    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Check if already an admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('event_admins')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already an admin for this event' }, { status: 409 });
    }

    // Add the admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newAdmin, error: insertError } = await (supabase as any)
      .from('event_admins')
      .insert({
        event_id: id,
        user_id: targetUser.id,
        role,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding event admin:', insertError);
      return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 });
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'add_event_admin',
      entity_type: 'event_admin',
      entity_id: newAdmin.id,
      details: {
        event_id: id,
        target_user_id: targetUser.id,
        target_email: email,
        role,
      },
    });

    return NextResponse.json({
      id: newAdmin.id,
      user_id: targetUser.id,
      role: newAdmin.role,
      user: {
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
