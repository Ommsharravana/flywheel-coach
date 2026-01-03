import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getTrackSubmissions } from '@/lib/admin/demo-day/services';

// GET: Get submissions for a specific track
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
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

    const submissions = await getTrackSubmissions(supabase, trackId);

    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error('Error in track submissions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
