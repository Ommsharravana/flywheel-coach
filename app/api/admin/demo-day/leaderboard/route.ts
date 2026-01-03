import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/admin/demo-day/services';

// GET: Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('track_id') || undefined;

    const leaderboard = await getLeaderboard(supabase, trackId);

    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    console.error('Error in leaderboard GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
