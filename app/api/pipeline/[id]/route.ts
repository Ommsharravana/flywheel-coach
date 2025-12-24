import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pipeline/[id] - Get single candidate details
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

    // Fetch candidate with details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidate, error: fetchError } = await (supabase as any)
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
          who_affected,
          institution_id,
          created_at,
          institutions!problem_bank_institution_id_fkey (name, short_name)
        ),
        problem_scores (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }
      console.error('Error fetching candidate:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch candidate', details: fetchError.message },
        { status: 500 }
      );
    }

    // Get stage history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: history } = await (supabase as any)
      .from('nif_stage_history')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      candidate: {
        ...candidate,
        problem: candidate.problem_bank,
        institution_name: candidate.problem_bank?.institutions?.name,
        institution_short: candidate.problem_bank?.institutions?.short_name,
        scores: candidate.problem_scores?.[0] || null,
        problem_bank: undefined,
        problem_scores: undefined,
      },
      history: history || [],
    });
  } catch (error) {
    console.error('Error in GET /api/pipeline/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/pipeline/[id] - Update candidate (stage, notes, startup info)
export async function PATCH(
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
    const {
      stage,
      decision_notes,
      rejection_reason,
      startup_name,
      startup_status,
      startup_website,
      team_members,
      funding_stage,
      funding_amount,
      jobs_created,
      revenue_generated,
    } = body;

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (stage !== undefined) updateData.stage = stage;
    if (decision_notes !== undefined) updateData.decision_notes = decision_notes;
    if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;
    if (startup_name !== undefined) updateData.startup_name = startup_name;
    if (startup_status !== undefined) updateData.startup_status = startup_status;
    if (startup_website !== undefined) updateData.startup_website = startup_website;
    if (team_members !== undefined) updateData.team_members = team_members;
    if (funding_stage !== undefined) updateData.funding_stage = funding_stage;
    if (funding_amount !== undefined) updateData.funding_amount = funding_amount;
    if (jobs_created !== undefined) updateData.jobs_created = jobs_created;
    if (revenue_generated !== undefined) updateData.revenue_generated = revenue_generated;

    // Update stage-specific fields
    if (stage === 'screened') {
      updateData.screened_by = user.id;
    } else if (stage === 'shortlisted') {
      updateData.shortlisted_by = user.id;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidate, error: updateError } = await (supabase as any)
      .from('nif_candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      return NextResponse.json(
        { error: 'Failed to update candidate', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (error) {
    console.error('Error in PATCH /api/pipeline/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline/[id] - Remove from pipeline
export async function DELETE(
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('nif_candidates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting candidate:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove from pipeline', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from pipeline',
    });
  } catch (error) {
    console.error('Error in DELETE /api/pipeline/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
