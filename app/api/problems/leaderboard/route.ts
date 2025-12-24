import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/problems/leaderboard - Get institution leaderboard for problems
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build leaderboard from cycles and problem_bank data
    // This works even if the view hasn't been created yet

    // Get cycles grouped by institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cycleData, error: cycleError } = await (supabase as any)
      .from('cycles')
      .select(`
        id,
        current_step,
        status,
        user_id,
        users!cycles_user_id_fkey (
          institution_id,
          institutions (id, name, short_name)
        ),
        problems (
          refined_statement,
          selected_question,
          q_takes_too_long,
          q_repetitive,
          q_lookup_repeatedly,
          q_complaints,
          q_would_pay
        )
      `);

    if (cycleError) {
      console.error('Error fetching cycles:', cycleError);
      return NextResponse.json({ error: 'Failed to fetch cycle data' }, { status: 500 });
    }

    // Get saved problems from problem_bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedProblems } = await (supabase as any)
      .from('problem_bank')
      .select('institution_id, status, validation_status');

    // Aggregate by institution
    const institutionStats: Record<string, {
      id: string;
      name: string;
      short_name: string;
      total_cycles: number;
      completed_cycles: number;
      problems_identified: number;
      problems_saved: number;
      problems_solved: number;
      problems_validated: number;
    }> = {};

    // Process cycles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cycleData || []).forEach((c: any) => {
      const instId = c.users?.institution_id;
      const inst = c.users?.institutions;

      if (!instId || !inst) return;

      if (!institutionStats[instId]) {
        institutionStats[instId] = {
          id: instId,
          name: inst.name,
          short_name: inst.short_name || inst.name,
          total_cycles: 0,
          completed_cycles: 0,
          problems_identified: 0,
          problems_saved: 0,
          problems_solved: 0,
          problems_validated: 0,
        };
      }

      institutionStats[instId].total_cycles++;

      if (c.current_step >= 7) {
        institutionStats[instId].completed_cycles++;
      }

      // Check if problem has any content
      const problem = c.problems?.[0];
      if (problem && (
        problem.refined_statement ||
        problem.selected_question ||
        problem.q_takes_too_long ||
        problem.q_repetitive ||
        problem.q_lookup_repeatedly ||
        problem.q_complaints ||
        problem.q_would_pay
      )) {
        institutionStats[instId].problems_identified++;
      }
    });

    // Process saved problems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (savedProblems || []).forEach((p: any) => {
      if (!p.institution_id || !institutionStats[p.institution_id]) return;

      institutionStats[p.institution_id].problems_saved++;

      if (p.status === 'solved') {
        institutionStats[p.institution_id].problems_solved++;
      }

      if (p.validation_status === 'desperate_user_confirmed' || p.validation_status === 'market_validated') {
        institutionStats[p.institution_id].problems_validated++;
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(institutionStats)
      .sort((a, b) => {
        // Sort by problems_identified first, then completed_cycles
        if (b.problems_identified !== a.problems_identified) {
          return b.problems_identified - a.problems_identified;
        }
        return b.completed_cycles - a.completed_cycles;
      });

    // Calculate totals
    const totals = {
      total_cycles: leaderboard.reduce((sum, i) => sum + i.total_cycles, 0),
      completed_cycles: leaderboard.reduce((sum, i) => sum + i.completed_cycles, 0),
      problems_identified: leaderboard.reduce((sum, i) => sum + i.problems_identified, 0),
      problems_saved: leaderboard.reduce((sum, i) => sum + i.problems_saved, 0),
      institutions: leaderboard.length,
    };

    return NextResponse.json({
      leaderboard,
      totals,
    });

  } catch (error) {
    console.error('Error in GET /api/problems/leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
