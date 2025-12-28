import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/search - Search users for team member selection
 *
 * Query params:
 * - q: Search query (name or email, partial match)
 * - role: Optional role filter (e.g., 'senior_learner')
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
  const eventId = searchParams.get('event_id') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Build query for user search
  // RLS policy allows authenticated users to search other users
  let dbQuery = supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      institutions:institution_id (name)
    `)
    .limit(limit)
    .order('name', { ascending: true });

  // Apply search filter (name or email)
  if (query.trim()) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  // Apply role filter
  if (role) {
    dbQuery = dbQuery.eq('role', role);
  }

  // Apply event filter
  if (eventId) {
    dbQuery = dbQuery.eq('active_event_id', eventId);
  }

  const { data: users, error } = await dbQuery;

  if (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the response to match expected format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedUsers = (users || []).map((u: any) => ({
    id: u.id,
    name: u.name || 'Unknown',
    email: u.email,
    role: u.role,
    institution: u.institutions?.name || null,
  }));

  return NextResponse.json({ users: transformedUsers });
}
