import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/search - Search users for team member selection
 *
 * Query params:
 * - q: Search query (name or email, partial match)
 * - role: Optional role filter for permission levels (e.g., 'facilitator')
 * - senior_learner: Optional boolean filter for senior learner classification ('true' or 'false')
 * - event_id: Optional event ID to scope search to event participants
 * - limit: Max results (default 20)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const role = searchParams.get('role') || null;
  const seniorLearnerParam = searchParams.get('senior_learner');
  const eventId = searchParams.get('event_id') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Parse senior_learner filter (null means no filter, true/false means filter)
  let seniorLearnerOnly: boolean | null = null;
  if (seniorLearnerParam === 'true') {
    seniorLearnerOnly = true;
  } else if (seniorLearnerParam === 'false') {
    seniorLearnerOnly = false;
  }

  // Use RPC function which bypasses RLS (SECURITY DEFINER)
  // This avoids infinite recursion from RLS policies that query users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, error } = await (supabase.rpc as any)('search_users_for_team', {
    search_query: query,
    role_filter: role,
    event_id_filter: eventId,
    result_limit: limit,
    senior_learner_only: seniorLearnerOnly,
  });

  if (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the response to match expected format
  const transformedUsers = (users || []).map((u: { id: string; name: string; email: string; role: string; institution: string | null; is_senior_learner: boolean }) => ({
    id: u.id,
    name: u.name || 'Unknown',
    email: u.email,
    role: u.role,
    institution: u.institution,
    isSeniorLearner: u.is_senior_learner || false,
  }));

  return NextResponse.json({ users: transformedUsers });
}
