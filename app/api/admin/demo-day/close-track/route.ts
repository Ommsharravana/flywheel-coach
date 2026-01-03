import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { closeTrack, reopenTrack } from '@/lib/admin/demo-day/services';

// POST: Close or reopen a track
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    const body = await request.json();
    const { track_id, action } = body;

    if (!track_id) {
      return NextResponse.json({ error: 'track_id is required' }, { status: 400 });
    }

    if (action === 'reopen') {
      await reopenTrack(supabase, track_id);
    } else {
      await closeTrack(supabase, track_id);
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: action === 'reopen' ? 'demo_day_reopen_track' : 'demo_day_close_track',
      entity_type: 'judging_track',
      entity_id: track_id,
      details: {},
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in close-track:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
