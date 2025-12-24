import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch candidates with problem details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('nif_candidates')
      .select(`
        *,
        problem_bank!inner (
          id,
          title,
          problem_statement,
          theme,
          status,
          validation_status,
          severity_rating,
          institution_id,
          created_at,
          institutions!problem_bank_institution_id_fkey (name, short_name)
        ),
        problem_scores (composite_score)
      `)
      .order('identified_at', { ascending: false });

    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }

    const { data: candidates, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching pipeline:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline', details: fetchError.message },
        { status: 500 }
      );
    }

    // Transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedCandidates = candidates?.map((c: any) => ({
      ...c,
      problem: {
        id: c.problem_bank.id,
        title: c.problem_bank.title,
        problem_statement: c.problem_bank.problem_statement,
        theme: c.problem_bank.theme,
        status: c.problem_bank.status,
        validation_status: c.problem_bank.validation_status,
        severity_rating: c.problem_bank.severity_rating,
        created_at: c.problem_bank.created_at,
      },
      institution_name: c.problem_bank.institutions?.name,
      institution_short: c.problem_bank.institutions?.short_name,
      composite_score: c.problem_scores?.[0]?.composite_score || null,
      problem_bank: undefined,
      problem_scores: undefined,
    })) || [];

    let stats = null;
    if (includeStats) {
      // Get pipeline stats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allCandidates } = await (supabase as any)
        .from('nif_candidates')
        .select('stage, jobs_created, revenue_generated, graduated_at, identified_at');

      if (allCandidates) {
        const byStage: Record<string, number> = {
          identified: 0,
          screened: 0,
          shortlisted: 0,
          incubating: 0,
          graduated: 0,
          rejected: 0,
          on_hold: 0,
        };

        let totalJobs = 0;
        let totalRevenue = 0;
        let graduatedCount = 0;
        let totalGraduationDays = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allCandidates.forEach((c: any) => {
          byStage[c.stage] = (byStage[c.stage] || 0) + 1;
          totalJobs += c.jobs_created || 0;
          totalRevenue += parseFloat(c.revenue_generated) || 0;

          if (c.stage === 'graduated' && c.graduated_at && c.identified_at) {
            graduatedCount++;
            const days = Math.floor(
              (new Date(c.graduated_at).getTime() - new Date(c.identified_at).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            totalGraduationDays += days;
          }
        });

        stats = {
          total_candidates: allCandidates.length,
          by_stage: byStage,
          total_startups: byStage.incubating + byStage.graduated,
          total_jobs_created: totalJobs,
          total_revenue: totalRevenue,
          avg_time_to_graduation_days:
            graduatedCount > 0 ? Math.round(totalGraduationDays / graduatedCount) : null,
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
