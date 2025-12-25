import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/events/leave - Leave current event
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear user's active_event_id using RPC function (bypasses RLS)
    // Note: We skip the "not in event" check since it's idempotent and RLS might block the query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .rpc('clear_user_active_event', {
        p_user_id: user.id,
      });

    if (updateError) {
      console.error('Error leaving event:', updateError);
      return NextResponse.json({ error: 'Failed to leave event' }, { status: 500 });
    }

    if (!updated) {
      console.error('User not found for event leave');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Left event successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
