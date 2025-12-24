import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/flywheel/summary - Get flywheel summary statistics
export async function GET(request: NextRequest) {
  try {
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

    // Compute flywheel summary from tables directly for more complete data
    const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Problems
    const { count: totalProblems } = await db.from('problem_bank').select('*', { count: 'exact', head: true });

    // Outcomes
    const { data: outcomes } = await db.from('problem_outcomes').select('problem_id, outcome_type, time_to_solution_days, users_impacted, time_saved_hours, cost_saved, revenue_generated');
    const problemsWithOutcomes = new Set(outcomes?.map((o: any) => o.problem_id) || []).size;
    const successfulOutcomes = outcomes?.filter((o: any) => o.outcome_type === 'success').length || 0;
    const outcomeRate = totalProblems ? problemsWithOutcomes / totalProblems : 0;
    const successRate = outcomes?.length ? successfulOutcomes / outcomes.length : 0;
    const avgSolutionTime = outcomes?.length
      ? outcomes.reduce((sum: number, o: any) => sum + (o.time_to_solution_days || 0), 0) / outcomes.length
      : null;
    const totalUsersImpacted = outcomes?.reduce((sum: number, o: any) => sum + (o.users_impacted || 0), 0) || 0;
    const totalTimeSavedHours = outcomes?.reduce((sum: number, o: any) => sum + (o.time_saved_hours || 0), 0) || 0;
    const totalCostSaved = outcomes?.reduce((sum: number, o: any) => sum + (o.cost_saved || 0), 0) || 0;
    const totalRevenueGenerated = outcomes?.reduce((sum: number, o: any) => sum + (o.revenue_generated || 0), 0) || 0;

    // Case Studies
    const { count: totalCaseStudies } = await db.from('case_studies').select('*', { count: 'exact', head: true });
    const { count: publishedCaseStudies } = await db.from('case_studies').select('*', { count: 'exact', head: true }).eq('status', 'published');
    const { data: caseStudyViews } = await db.from('case_studies').select('view_count');
    const totalCaseStudyViews = caseStudyViews?.reduce((sum: number, cs: any) => sum + (cs.view_count || 0), 0) || 0;

    // AI Refinements
    const { count: totalRefinements } = await db.from('ai_refinements').select('*', { count: 'exact', head: true });
    const { count: refinementsAccepted } = await db.from('ai_refinements').select('*', { count: 'exact', head: true }).eq('status', 'accepted');
    const refinementAcceptanceRate = totalRefinements ? (refinementsAccepted || 0) / totalRefinements : 0;

    // Learning Patterns
    const { count: totalPatterns } = await db.from('learning_patterns').select('*', { count: 'exact', head: true });
    const { count: activePatterns } = await db.from('learning_patterns').select('*', { count: 'exact', head: true }).eq('is_active', true);

    const summary = {
      total_problems: totalProblems || 0,
      problems_with_outcomes: problemsWithOutcomes,
      outcome_rate: outcomeRate,
      success_rate: successRate,
      average_solution_time_days: avgSolutionTime,
      total_users_impacted: totalUsersImpacted,
      total_time_saved_hours: totalTimeSavedHours,
      total_cost_saved: totalCostSaved,
      total_revenue_generated: totalRevenueGenerated,
      total_case_studies: totalCaseStudies || 0,
      published_case_studies: publishedCaseStudies || 0,
      total_case_study_views: totalCaseStudyViews,
      total_refinements: totalRefinements || 0,
      refinements_accepted: refinementsAccepted || 0,
      refinement_acceptance_rate: refinementAcceptanceRate,
      total_patterns: totalPatterns || 0,
      active_patterns: activePatterns || 0,
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error in GET /api/flywheel/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/flywheel/summary - Trigger metrics computation
export async function POST(request: NextRequest) {
  try {
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

    // Call the compute_flywheel_metrics function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: computeError } = await (supabase as any)
      .rpc('compute_flywheel_metrics');

    if (computeError) {
      console.error('Error computing flywheel metrics:', computeError);
      return NextResponse.json(
        { error: 'Failed to compute metrics', details: computeError.message },
        { status: 500 }
      );
    }

    // Get the updated summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: summary } = await (supabase as any)
      .from('flywheel_summary')
      .select('*')
      .single();

    return NextResponse.json({
      message: 'Flywheel metrics computed successfully',
      summary,
    });

  } catch (error) {
    console.error('Error in POST /api/flywheel/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
