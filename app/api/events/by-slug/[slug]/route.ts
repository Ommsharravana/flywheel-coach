import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/events/by-slug/[slug] - Get event by slug with admin data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event by slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user can manage this event
    const { isAdmin, role } = await checkEventAdminAccess(user.id, event.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get event admins
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins, error: adminsError } = await (supabase as any)
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
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });

    if (adminsError) {
      console.error('Error fetching event admins:', adminsError);
    }

    // Transform admins
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

    return NextResponse.json({
      event,
      admins: transformedAdmins,
      userRole: role,
    });
  } catch (error) {
    console.error('Error in GET /api/events/by-slug/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
