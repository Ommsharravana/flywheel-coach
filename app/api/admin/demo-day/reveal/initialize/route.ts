import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { initializeRevealState } from '@/lib/admin/demo-day/reveal-state';

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';

// POST: Initialize reveal state
export async function POST() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc(
      'get_current_user_role'
    );

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin only' },
        { status: 403 }
      );
    }

    // Get all tracks in demo order
    const { data: tracks, error: tracksError } = await supabase
      .from('judging_tracks')
      .select('id')
      .eq('event_id', APPATHON_EVENT_ID)
      .order('demo_order') as { data: { id: string }[] | null; error: unknown };

    if (tracksError) {
      throw tracksError;
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found for event' },
        { status: 400 }
      );
    }

    const tracksOrder = tracks.map((t) => t.id);
    const state = await initializeRevealState(supabase, tracksOrder);

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Error in reveal initialize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
