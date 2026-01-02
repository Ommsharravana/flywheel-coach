import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/search - Search users for team member selection
 *
 * Query params:
 * - q: Search query (name or email, partial match)
 * - role: Optional role filter for permission levels (e.g., 'admin', 'builder')
 * - category: Optional category filter ('learner' or 'senior_learner')
 * - event_id: Optional event ID to scope search to event builders
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
  const categoryFilter = searchParams.get('category') || null; // 'learner' or 'senior_learner'
  const eventId = searchParams.get('event_id') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Use RPC function which bypasses RLS (SECURITY DEFINER)
  // This avoids infinite recursion from RLS policies that query users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, error } = await (supabase.rpc as any)('search_users_for_team', {
    search_query: query,
    role_filter: role,
    event_id_filter: eventId,
    result_limit: limit,
    category_filter: categoryFilter,
  });

  if (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the response to match expected format
  const transformedUsers = (users || []).map((u: { id: string; name: string; email: string; role: string; institution: string | null; user_category: string }) => ({
    id: u.id,
    name: u.name || 'Unknown',
    email: u.email,
    role: u.role,
    institution: u.institution,
    userCategory: u.user_category || 'learner',
  }));

  return NextResponse.json({ users: transformedUsers });
}
