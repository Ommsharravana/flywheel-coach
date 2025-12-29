import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminEvents } from '@/lib/methodologies/helpers';

/**
 * GET /api/admin/events - Get events that the current admin can manage
 * Returns list of events with their details for dropdown selection
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get events the user can admin
    const adminEvents = await getAdminEvents(user.id);

    if (adminEvents.length === 0) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Get user's active event ID for smart default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('active_event_id')
      .eq('id', user.id)
      .single();

    const activeEventId = (userProfile as { active_event_id: string | null } | null)?.active_event_id;

    return NextResponse.json({
      events: adminEvents,
      activeEventId: activeEventId || null,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
