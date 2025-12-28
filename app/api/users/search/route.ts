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
  const role = searchParams.get('role');
  const eventId = searchParams.get('event_id');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Build the query
  let dbQuery = supabase
    .from('users')
    .select('id, name, email, role, institution_id, institutions(name)')
    .order('name', { ascending: true })
    .limit(limit);

  // Search by name or email (case-insensitive)
  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  // Filter by role if specified
  if (role) {
    dbQuery = dbQuery.eq('role', role);
  }

  // Filter by event participants if event_id specified
  if (eventId) {
    dbQuery = dbQuery.eq('active_event_id', eventId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, error } = await dbQuery as any;

  if (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the response to flatten institution name
  const transformedUsers = (users || []).map((u: {
    id: string;
    name: string;
    email: string;
    role: string;
    institution_id: string | null;
    institutions: { name: string } | null;
  }) => ({
    id: u.id,
    name: u.name || 'Unknown',
    email: u.email,
    role: u.role,
    institution: u.institutions?.name || null,
  }));

  return NextResponse.json({ users: transformedUsers });
}
