import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/[id]/attempts - Get all attempts for a problem
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempts, error } = await (supabase as any)
      .from('problem_attempts')
      .select('*')
      .eq('problem_id', id)
      .order('started_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(attempts || []);

  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/problems/[id]/attempts - Start a new attempt on a problem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for team name default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    const body = await request.json();
    const { team_name, cycle_id } = body;

    // Check if user already has an active attempt on this problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('problem_attempts')
      .select('id')
      .eq('problem_id', id)
      .eq('user_id', user.id)
      .is('outcome', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active attempt on this problem', attempt_id: existing.id },
        { status: 409 }
      );
    }

    // Create the attempt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attempt, error: insertError } = await (supabase as any)
      .from('problem_attempts')
      .insert({
        problem_id: id,
        user_id: user.id,
        cycle_id: cycle_id || null,
        team_name: team_name || userProfile?.name || userProfile?.email || 'Anonymous',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating attempt:', insertError);
      return NextResponse.json(
        { error: 'Failed to start attempt', details: insertError.message },
        { status: 500 }
      );
    }

    // Update problem status to "claimed" if it was "open"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('problem_bank')
      .update({
        status: 'claimed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'open');

    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      message: 'Attempt started successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error starting attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
