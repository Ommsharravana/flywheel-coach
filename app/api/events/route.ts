import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Event, EventWithParticipantCount } from '@/lib/events/types';

// Helper to check if user is superadmin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isSuperAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as { role: string } | null)?.role === 'superadmin';
}

// GET /api/events - List all active events with participant counts
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active events (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: events, error } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Fetch participant counts for each event
    const eventsWithCounts: EventWithParticipantCount[] = await Promise.all(
      ((events as Event[]) || []).map(async (event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('active_event_id', event.id);

        return {
          ...event,
          participant_count: count || 0,
        } as EventWithParticipantCount;
      })
    );

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events - Create a new event (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is superadmin
    if (!(await isSuperAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();

    const { slug, name, description, start_date, end_date, config, banner_color } = body;

    // Validate required fields
    if (!slug || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, start_date, end_date' },
        { status: 400 }
      );
    }

    // Create the event (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error } = await (supabase as any)
      .from('events')
      .insert({
        slug,
        name,
        description,
        start_date,
        end_date,
        config: config || {},
        banner_color: banner_color || 'amber',
        created_by: user?.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An event with this slug already exists' }, { status: 409 });
      }
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Log admin activity (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user?.id,
      action: 'create_event',
      entity_type: 'event',
      entity_id: (event as Event).id,
      details: { slug, name },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
