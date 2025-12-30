import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Temporary debug endpoint - DELETE AFTER DEBUGGING
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. Check total submissions count
  const { count: totalSubmissions, error: countError } = await supabase
    .from('appathon_submissions')
    .select('*', { count: 'exact', head: true });

  // 2. Get all events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, slug') as { data: Array<{ id: string; name: string; slug: string }> | null; error: unknown };

  // 3. Get submissions per event
  const { data: submissionsByEvent, error: subError } = await supabase
    .from('appathon_submissions')
    .select('event_id, status')
    .order('event_id');

  // 4. Check if RPC function exists by trying to call it
  let rpcResult = null;
  let rpcError = null;
  if (events && events.length > 0) {
    const testEventId = events[0].id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_event_submissions', {
      target_event_id: testEventId,
      caller_user_id: user.id
    });
    rpcResult = data;
    rpcError = error;
  }

  // 5. Check user's admin access
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // 6. Check event_admins table
  const { data: eventAdmins } = await supabase
    .from('event_admins')
    .select('event_id, user_id, role')
    .eq('user_id', user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: userProfile?.role
    },
    database: {
      totalSubmissions,
      countError: countError?.message,
      events: events?.map(e => ({ id: e.id, name: e.name, slug: e.slug })),
      eventsError: eventsError?.message,
      submissionsByEvent: submissionsByEvent?.reduce((acc, s) => {
        acc[s.event_id] = (acc[s.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      subError: subError?.message
    },
    rpc: {
      testResult: rpcResult?.length ?? 'null',
      rpcError: rpcError?.message
    },
    access: {
      eventAdmins
    }
  });
}
