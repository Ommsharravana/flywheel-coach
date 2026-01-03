import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { moveToEnd } from '@/lib/admin/demo-day/services';

// POST: Move a team to end of queue (technical issues)
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
    const { track_id, submission_id } = body;

    if (!track_id || !submission_id) {
      return NextResponse.json({ error: 'track_id and submission_id are required' }, { status: 400 });
    }

    await moveToEnd(supabase, track_id, submission_id);

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_activity_logs').insert({
      admin_id: user.id,
      action: 'demo_day_move_to_end',
      entity_type: 'submission',
      entity_id: submission_id,
      details: { track_id },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in move-to-end:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
