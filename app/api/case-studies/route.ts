import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { CreateCaseStudyInput } from '@/lib/types/problem-bank';

// GET /api/case-studies - List all case studies
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

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

    // Parse query params
    const status = searchParams.get('status');
    const theme = searchParams.get('theme');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const published = searchParams.get('published') === 'true';

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('case_studies')
      .select(`
        *,
        problem:problem_bank!case_studies_problem_id_fkey (
          id, title, problem_statement, theme,
          institution:institutions!problem_bank_institution_id_fkey (id, name, short_name)
        ),
        author:users!case_studies_created_by_fkey (id, name, email)
      `, { count: 'exact' });

    // Non-superadmins can only see published case studies
    if (!isSuperAdmin || published) {
      query = query.eq('status', 'published');
    } else if (status) {
      query = query.eq('status', status);
    }

    // Filter by theme (from related problem)
    if (theme) {
      query = query.eq('problem.theme', theme);
    }

    // Order and paginate
    query = query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: caseStudies, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching case studies:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch case studies', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: caseStudies || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/case-studies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/case-studies - Create a new case study
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

    const body: CreateCaseStudyInput = await request.json();

    // Validate required fields
    if (!body.problem_id || !body.title) {
      return NextResponse.json(
        { error: 'problem_id and title are required' },
        { status: 400 }
      );
    }

    // Verify problem exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: problem, error: problemError } = await (supabase as any)
      .from('problem_bank')
      .select('id, title')
      .eq('id', body.problem_id)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Create the case study
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseStudy, error: insertError } = await (supabase as any)
      .from('case_studies')
      .insert({
        problem_id: body.problem_id,
        attempt_id: body.attempt_id || null,
        title: body.title,
        summary: body.summary || null,
        full_content: body.full_content || null,
        problem_section: body.problem_section || null,
        approach_section: body.approach_section || null,
        solution_section: body.solution_section || null,
        impact_section: body.impact_section || null,
        lessons_section: body.lessons_section || null,
        target_audience: body.target_audience || [],
        difficulty_level: body.difficulty_level || 'intermediate',
        estimated_read_time_minutes: body.estimated_read_time_minutes || 10,
        related_problems: body.related_problems || [],
        external_references: body.external_references || [],
        media_urls: body.media_urls || [],
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating case study:', insertError);
      return NextResponse.json(
        { error: 'Failed to create case study', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(caseStudy, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/case-studies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
