import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface PipelineCandidate {
  id: string;
  problem_id: string;
  stage: string;
  identified_at: string;
  identified_by: string | null;
  screened_at: string | null;
  shortlisted_at: string | null;
  incubation_started_at: string | null;
  graduated_at: string | null;
  jobs_created: number | null;
  revenue_generated: number | null;
  decision_notes: string | null;
  problem_title: string;
  problem_statement: string;
  problem_theme: string | null;
  problem_status: string;
  problem_validation_status: string;
  problem_severity_rating: number | null;
  problem_institution_id: string | null;
  problem_created_at: string;
  institution_name: string | null;
  institution_short_name: string | null;
  composite_score: number | null;
}

interface PipelineStats {
  total_candidates: number;
  by_stage: Record<string, number>;
  total_startups: number;
  total_jobs_created: number;
  total_revenue: number;
  avg_time_to_graduation_days: number | null;
}

// GET /api/pipeline - Get all NIF candidates with details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Use RPC function to fetch pipeline (bypasses RLS issues with auth.uid() in server components)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidates, error: fetchError } = await (supabase as any).rpc('get_nif_pipeline_admin', {
      caller_user_id: user.id,
      stage_filter: stage || null
    });

    if (fetchError) {
      console.error('Error fetching pipeline:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline', details: fetchError.message },
        { status: 500 }
      );
    }

    // Transform RPC data to expected format
    const transformedCandidates = ((candidates || []) as PipelineCandidate[]).map((c) => ({
      id: c.id,
      problem_id: c.problem_id,
      stage: c.stage,
      identified_at: c.identified_at,
      identified_by: c.identified_by,
      screened_at: c.screened_at,
      shortlisted_at: c.shortlisted_at,
      incubation_started_at: c.incubation_started_at,
      graduated_at: c.graduated_at,
      jobs_created: c.jobs_created,
      revenue_generated: c.revenue_generated,
      decision_notes: c.decision_notes,
      problem: {
        id: c.problem_id,
        title: c.problem_title,
        problem_statement: c.problem_statement,
        theme: c.problem_theme,
        status: c.problem_status,
        validation_status: c.problem_validation_status,
        severity_rating: c.problem_severity_rating,
        created_at: c.problem_created_at,
      },
      institution_name: c.institution_name,
      institution_short: c.institution_short_name,
      composite_score: c.composite_score,
    }));

    let stats: PipelineStats | null = null;
    if (includeStats) {
      // Use RPC function to fetch stats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: statsData } = await (supabase as any).rpc('get_nif_pipeline_stats_admin', {
        caller_user_id: user.id
      });

      if (statsData && statsData.length > 0) {
        const s = statsData[0];
        stats = {
          total_candidates: s.total_candidates || 0,
          by_stage: s.by_stage || {},
          total_startups: s.total_startups || 0,
          total_jobs_created: s.total_jobs_created || 0,
          total_revenue: parseFloat(s.total_revenue) || 0,
          avg_time_to_graduation_days: s.avg_time_to_graduation_days,
        };
      }
    }

    return NextResponse.json({
      candidates: transformedCandidates,
      total: transformedCandidates.length,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/pipeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline - Add problem to NIF pipeline
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { problem_id, notes } = body;

    if (!problem_id) {
      return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
    }

    // Check if problem exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem } = await (supabase as any)
      .from('problem_bank')
      .select('id, title')
      .eq('id', problem_id)
      .single();

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Add to pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidate, error: insertError } = await (supabase as any)
      .from('nif_candidates')
      .insert({
        problem_id,
        identified_by: user.id,
        decision_notes: notes,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Problem is already in the pipeline' },
          { status: 409 }
        );
      }
      console.error('Error adding to pipeline:', insertError);
      return NextResponse.json(
        { error: 'Failed to add to pipeline', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate_id: candidate.id,
      message: `"${problem.title}" added to NIF pipeline`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/pipeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
