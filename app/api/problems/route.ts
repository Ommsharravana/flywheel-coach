import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { ProblemFilters, ProblemSort, ProblemCardData } from '@/lib/types/problem-bank';
import { getAdminEvents } from '@/lib/methodologies/helpers';

// GET /api/problems - List all problems (admin access with event scoping)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access and get event scope
    const adminEvents = await getAdminEvents(user.id);
    const isSuperadmin = adminEvents.some(e => e.role === 'superadmin');

    if (adminEvents.length === 0) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Get event IDs for filtering (null if superadmin sees all)
    const eventIds = isSuperadmin ? null : adminEvents.map(e => e.id);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const offset = (page - 1) * perPage;

    // Filters
    const filters: ProblemFilters = {
      theme: searchParams.get('theme') as ProblemFilters['theme'] || undefined,
      status: searchParams.get('status') as ProblemFilters['status'] || undefined,
      validation_status: searchParams.get('validation_status') as ProblemFilters['validation_status'] || undefined,
      institution_id: searchParams.get('institution_id') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Sort
    const sort: ProblemSort = {
      field: (searchParams.get('sort_by') as ProblemSort['field']) || 'created_at',
      direction: (searchParams.get('sort_dir') as ProblemSort['direction']) || 'desc',
    };

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('problem_bank')
      .select(`
        id,
        title,
        problem_statement,
        theme,
        status,
        validation_status,
        severity_rating,
        desperate_user_score,
        created_at,
        institution_id,
        submitted_by,
        institutions!problem_bank_institution_id_fkey (name, short_name)
      `, { count: 'exact' });

    // Apply event filtering for non-superadmin
    if (eventIds) {
      query = query.in('event_id', eventIds);
    }

    // Apply filters
    if (filters.theme) {
      query = query.eq('theme', filters.theme);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.validation_status) {
      query = query.eq('validation_status', filters.validation_status);
    }
    if (filters.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,problem_statement.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + perPage - 1);

    const { data: problems, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching problems:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch problems', details: queryError.message },
        { status: 500 }
      );
    }

    // Get attempt counts for each problem
    const problemIds = problems?.map((p: { id: string }) => p.id) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attemptCounts } = problemIds.length > 0 ? await (supabase as any)
      .from('problem_attempts')
      .select('problem_id')
      .in('problem_id', problemIds) : { data: [] };

    // Count attempts per problem
    const attemptsMap = (attemptCounts || []).reduce((acc: Record<string, number>, curr: { problem_id: string }) => {
      acc[curr.problem_id] = (acc[curr.problem_id] || 0) + 1;
      return acc;
    }, {});

    // Transform to ProblemCardData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardData: ProblemCardData[] = (problems || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      problem_statement: p.problem_statement,
      theme: p.theme,
      status: p.status,
      validation_status: p.validation_status,
      severity_rating: p.severity_rating,
      desperate_user_score: p.desperate_user_score,
      created_at: p.created_at,
      attempt_count: attemptsMap[p.id] || 0,
      institution_name: p.institutions?.name || undefined,
      institution_short: p.institutions?.short_name || undefined,
    }));

    return NextResponse.json({
      data: cardData,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });

  } catch (error) {
    console.error('Error in GET /api/problems:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/problems - Create a new problem manually (admin access)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const adminEvents = await getAdminEvents(user.id);
    if (adminEvents.length === 0) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Get user profile for institution_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    const body = await request.json();
    const {
      title,
      problem_statement,
      theme,
      who_affected,
      when_occurs,
      where_occurs,
      frequency,
      severity_rating,
      source_type = 'manual',
      source_event,
      validation_status = 'unvalidated',
      status = 'open',
    } = body;

    if (!title || !problem_statement) {
      return NextResponse.json(
        { error: 'Missing required fields: title and problem_statement' },
        { status: 400 }
      );
    }

    // Insert into problem_bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProblem, error: insertError } = await (supabase as any)
      .from('problem_bank')
      .insert({
        title: title.substring(0, 200),
        problem_statement,
        theme: theme || 'other',
        who_affected: who_affected || null,
        when_occurs: when_occurs || null,
        where_occurs: where_occurs || null,
        frequency: frequency || null,
        severity_rating: severity_rating || null,
        source_type,
        source_event: source_event || null,
        source_year: new Date().getFullYear(),
        validation_status,
        status,
        is_open_for_attempts: true,
        institution_id: (userProfile as { institution_id: string | null } | null)?.institution_id || null,
        submitted_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting problem:', insertError);
      return NextResponse.json(
        { error: 'Failed to create problem', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      problem_id: newProblem.id,
      message: 'Problem created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
