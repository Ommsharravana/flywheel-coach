import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/case-studies/[id] - Get single case study
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

    // Check if user is superadmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = (userProfile as { role: string } | null)?.role === 'superadmin';

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('case_studies')
      .select(`
        *,
        problem:problem_bank!case_studies_problem_id_fkey (
          id, title, problem_statement, theme, sub_theme,
          who_affected, when_occurs, where_occurs, frequency,
          institution:institutions!problem_bank_institution_id_fkey (id, name, short_name)
        ),
        attempt:problem_attempts!case_studies_attempt_id_fkey (
          id, team_name, outcome, started_at, completed_at, app_url
        ),
        author:users!case_studies_created_by_fkey (id, name, email)
      `)
      .eq('id', id);

    // Non-superadmins can only see published case studies
    if (!isSuperAdmin) {
      query = query.eq('status', 'published');
    }

    const { data: caseStudy, error: queryError } = await query.single();

    if (queryError || !caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    // Increment view count for published case studies
    if (caseStudy.status === 'published') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('case_studies')
        .update({ view_count: (caseStudy.view_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json(caseStudy);

  } catch (error) {
    console.error('Error in GET /api/case-studies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/case-studies/[id] - Update case study
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

    const body = await request.json();

    // If publishing, set published_at
    const updateData: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'published') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('case_studies')
        .select('published_at')
        .eq('id', id)
        .single();

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // Update the case study
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('case_studies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating case study:', updateError);
      return NextResponse.json(
        { error: 'Failed to update case study', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error('Error in PATCH /api/case-studies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/case-studies/[id] - Delete case study
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

    // Delete the case study
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('case_studies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting case study:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete case study', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/case-studies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
