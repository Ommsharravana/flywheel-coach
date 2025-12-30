import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/submissions?event_id=xxx - List submissions for an event
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use RPC to get submissions (handles access check internally)
  // Pass caller_user_id explicitly for Server Component auth compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissions, error } = await (supabase as any).rpc('get_event_submissions', {
    target_event_id: eventId,
    caller_user_id: user.id
  });

  if (error) {
    if (error.message?.includes('Access denied')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: submissions || [] });
}
