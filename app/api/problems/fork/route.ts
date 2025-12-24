import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/problems/fork - Fork a problem from the bank to start a new cycle
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problem_id } = body;

    if (!problem_id) {
      return NextResponse.json(
        { error: 'Missing required field: problem_id' },
        { status: 400 }
      );
    }

    // Fetch the problem from the bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('*')
      .eq('id', problem_id)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Create a new cycle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCycle, error: cycleError } = await (supabase as any)
      .from('cycles')
      .insert({
        name: `Fork: ${problem.title.substring(0, 100)}`,
        user_id: user.id,
        status: 'active',
        current_step: 2, // Start at Context Discovery (problem already defined)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (cycleError) {
      console.error('Error creating cycle:', cycleError);
      return NextResponse.json(
        { error: 'Failed to create cycle', details: cycleError.message },
        { status: 500 }
      );
    }

    // Create the problem record linked to the new cycle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: problemInsertError } = await (supabase as any)
      .from('problems')
      .insert({
        cycle_id: newCycle.id,
        refined_statement: problem.problem_statement,
        selected_question: problem.title,
        // Pre-fill any question data if available
        q_takes_too_long: null,
        q_repetitive: null,
        q_lookup_repeatedly: null,
        q_complaints: null,
        q_would_pay: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (problemInsertError) {
      console.error('Error creating problem:', problemInsertError);
      // Delete the orphaned cycle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('cycles').delete().eq('id', newCycle.id);
      return NextResponse.json(
        { error: 'Failed to create problem record' },
        { status: 500 }
      );
    }

    // Create context record with pre-filled data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('contexts')
      .insert({
        cycle_id: newCycle.id,
        who_affected: problem.who_affected || null,
        when_occurs: problem.when_occurs || null,
        where_occurs: problem.where_occurs || null,
        frequency: problem.frequency || null,
        severity_rating: problem.severity_rating || null,
        current_workaround: problem.current_workaround || null,
        problem_description: problem.problem_statement,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Record this as an attempt on the problem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('problem_attempts')
      .insert({
        problem_id: problem_id,
        cycle_id: newCycle.id,
        outcome: 'building',
        started_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      cycle_id: newCycle.id,
      message: 'Problem forked successfully. Your new cycle is ready!',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/fork:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
