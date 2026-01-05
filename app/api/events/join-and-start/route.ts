import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface EventRow {
  id: string;
  name: string;
  slug: string;
  end_date: string;
}

// POST /api/events/join-and-start - Join an event AND create a new cycle
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

    // Verify the event exists and is active
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
    const eventHasEnded = now > endDate;

    // Check if user is already in this event (bypass the ended check for existing participants)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('active_event_id')
      .eq('id', user.id)
      .single();

    const userAlreadyInEvent = userProfile?.active_event_id === eventId;

    // Only block NEW users from joining ended events
    // Existing participants can still create new cycles
    if (eventHasEnded && !userAlreadyInEvent) {
      return NextResponse.json({ error: 'This event has ended' }, { status: 400 });
    }

    // Step 1: Update user's active_event_id using RPC function (bypasses RLS)
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

    // Step 2: Create a new cycle for this event
    const cycleId = uuidv4();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: cycleError } = await (supabase.from('cycles') as any).insert({
      id: cycleId,
      user_id: user.id,
      name: 'New Cycle',
      status: 'active',
      current_step: 1,
      event_id: eventId,
    });

    if (cycleError) {
      console.error('Error creating cycle:', cycleError);
      // Still return success for join - just log the cycle error
      return NextResponse.json({
        success: true,
        joined: true,
        cycleCreated: false,
        message: `Joined ${event.name}, but cycle creation failed`,
        event: { id: event.id, name: event.name, slug: event.slug },
        redirectUrl: '/dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      joined: true,
      cycleCreated: true,
      message: `Joined ${event.name} and started a new cycle`,
      event: { id: event.id, name: event.name, slug: event.slug },
      cycleId,
      redirectUrl: `/cycle/${cycleId}/step/1`,
    });
  } catch (error) {
    console.error('Error in POST /api/events/join-and-start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
