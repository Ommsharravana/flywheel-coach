import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { RecordOutcomeInput } from '@/lib/types/problem-bank';

// GET /api/problems/[id]/outcomes - Get all outcomes for a problem
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

    // Fetch outcomes for this problem with recorder info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: outcomes, error: queryError } = await (supabase as any)
      .from('problem_outcomes')
      .select(`
        *,
        recorder:users!problem_outcomes_recorded_by_fkey (id, name, email),
        attempt:problem_attempts!problem_outcomes_attempt_id_fkey (id, team_name, outcome, started_at, completed_at)
      `)
      .eq('problem_id', id)
      .order('recorded_at', { ascending: false });

    if (queryError) {
      console.error('Error fetching outcomes:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch outcomes', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(outcomes || []);

  } catch (error) {
    console.error('Error in GET /api/problems/[id]/outcomes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/problems/[id]/outcomes - Record a new outcome
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

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((userProfile as { role: string } | null)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - superadmin only' }, { status: 403 });
    }

    // Verify problem exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('id')
      .eq('id', id)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const body: RecordOutcomeInput = await request.json();

    // Validate required fields
    if (!body.outcome_type) {
      return NextResponse.json({ error: 'outcome_type is required' }, { status: 400 });
    }

    const validOutcomes = ['success', 'partial', 'pivot', 'abandoned', 'ongoing'];
    if (!validOutcomes.includes(body.outcome_type)) {
      return NextResponse.json({ error: 'Invalid outcome_type' }, { status: 400 });
    }

    // Create the outcome
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: outcome, error: insertError } = await (supabase as any)
      .from('problem_outcomes')
      .insert({
        problem_id: id,
        attempt_id: body.attempt_id || null,
        outcome_type: body.outcome_type,
        outcome_description: body.outcome_description || null,
        time_to_solution_days: body.time_to_solution_days || null,
        iterations_count: body.iterations_count || 1,
        user_adoption_rate: body.user_adoption_rate || null,
        satisfaction_score: body.satisfaction_score || null,
        users_impacted: body.users_impacted || 0,
        time_saved_hours: body.time_saved_hours || 0,
        cost_saved: body.cost_saved || 0,
        revenue_generated: body.revenue_generated || 0,
        what_worked: body.what_worked || null,
        what_didnt_work: body.what_didnt_work || null,
        key_insights: body.key_insights || [],
        recommendations: body.recommendations || [],
        recorded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error recording outcome:', insertError);
      return NextResponse.json(
        { error: 'Failed to record outcome', details: insertError.message },
        { status: 500 }
      );
    }

    // If outcome is success, update the problem status
    if (body.outcome_type === 'success') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('problem_bank')
        .update({ status: 'solved', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    return NextResponse.json(outcome, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/[id]/outcomes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
