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

    // Get current event for response message (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('active_event_id')
      .eq('id', user.id)
      .single();

    const userRow = userData as { active_event_id: string | null } | null;

    if (!userRow?.active_event_id) {
      return NextResponse.json({ error: 'Not currently in any event' }, { status: 400 });
    }

    // Clear user's active_event_id (using type assertion)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({
        active_event_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error leaving event:', updateError);
      return NextResponse.json({ error: 'Failed to leave event' }, { status: 500 });
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
