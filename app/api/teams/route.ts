import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/teams - Get user's teams
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teams where user is a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberships, error: membershipError } = await (supabase as any)
      .from('team_members')
      .select(`
        team_id,
        teams:team_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Error fetching teams:', membershipError);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    // Extract teams from memberships
    const teams = memberships
      ?.map((m: { teams: { id: string; name: string } | null }) => m.teams)
      .filter(Boolean) || [];

    return NextResponse.json({ teams });

  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
