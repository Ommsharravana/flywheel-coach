import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/problems/[id]/claim - Claim a problem for a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { team_id } = body;

    if (!team_id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('*')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Check problem is open and approved
    if (problem.status !== 'open') {
      return NextResponse.json(
        { error: 'Problem is not open for claims' },
        { status: 400 }
      );
    }

    if (problem.approval_status !== 'approved') {
      return NextResponse.json(
        { error: 'Problem is not approved' },
        { status: 400 }
      );
    }

    if (problem.claimed_by_team_id) {
      return NextResponse.json(
        { error: 'Problem is already claimed by another team' },
        { status: 400 }
      );
    }

    // Verify team exists and user is a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: team, error: teamError } = await (supabase as any)
      .from('teams')
      .select('id, name')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check user is team member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Claim the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('problem_bank')
      .update({
        claimed_by_team_id: team_id,
        claimed_at: new Date().toISOString(),
        status: 'claimed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId);

    if (updateError) {
      console.error('Error claiming problem:', updateError);
      return NextResponse.json({ error: 'Failed to claim problem' }, { status: 500 });
    }

    // Create a problem attempt record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('problem_attempts')
      .insert({
        problem_id: problemId,
        user_id: user.id,
        team_name: team.name,
        outcome: 'building',
        started_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Problem claimed successfully!',
      problem_id: problemId,
      team_id,
      team_name: team.name,
    });

  } catch (error) {
    console.error('Error in POST /api/problems/[id]/claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/problems/[id]/claim - Release a problem claim
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('*')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    if (!problem.claimed_by_team_id) {
      return NextResponse.json(
        { error: 'Problem is not claimed' },
        { status: 400 }
      );
    }

    // Check user is team member or admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('team_members')
      .select('id')
      .eq('team_id', problem.claimed_by_team_id)
      .eq('user_id', user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'superadmin';

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: 'You cannot release this claim' },
        { status: 403 }
      );
    }

    // Release the claim
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('problem_bank')
      .update({
        claimed_by_team_id: null,
        claimed_at: null,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId);

    if (updateError) {
      console.error('Error releasing claim:', updateError);
      return NextResponse.json({ error: 'Failed to release claim' }, { status: 500 });
    }

    // Update attempt to abandoned
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('problem_attempts')
      .update({
        outcome: 'abandoned',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('problem_id', problemId)
      .eq('outcome', 'building');

    return NextResponse.json({
      success: true,
      message: 'Problem claim released',
      problem_id: problemId,
    });

  } catch (error) {
    console.error('Error in DELETE /api/problems/[id]/claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
