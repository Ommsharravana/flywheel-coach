import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface EventRow {
  id: string;
  name: string;
  slug: string;
  end_date: string;
}

// POST /api/events/join - Join an event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Verify the event exists and is active (using type assertion for new table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData, error: eventError } = await (supabase as any)
      .from('events')
      .select('id, name, slug, end_date')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    const event = eventData as EventRow | null;

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    // Check if event has ended
    const now = new Date();
    const endDate = new Date(event.end_date);
    if (now > endDate) {
      return NextResponse.json({ error: 'This event has ended' }, { status: 400 });
    }

    // Update user's active_event_id using RPC function (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .rpc('update_user_active_event', {
        p_user_id: user.id,
        p_event_id: eventId,
      });

    if (updateError) {
      console.error('Error joining event:', updateError);
      return NextResponse.json({ error: 'Failed to join event' }, { status: 500 });
    }

    if (!updated) {
      console.error('User not found for event join');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Joined ${event.name}`,
      event: { id: event.id, name: event.name, slug: event.slug },
    });
  } catch (error) {
    console.error('Error in POST /api/events/join:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
