import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/eligible-cycles - Get all cycles with problem statements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('all') === 'true';

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

    // Fetch ALL cycles with their problems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('cycles')
      .select(`
        id,
        name,
        status,
        current_step,
        created_at,
        updated_at,
        user_id,
        users!cycles_user_id_fkey (id, name, email),
        problems (id, selected_question, refined_statement)
      `)
      .order('updated_at', { ascending: false });

    // If not showing all, only show step 7+
    if (!showAll) {
      query = query.gte('current_step', 7);
    }

    const { data: cycles, error: cyclesError } = await query;

    if (cyclesError) {
      console.error('Error fetching cycles:', cyclesError);
      return NextResponse.json(
        { error: 'Failed to fetch cycles', details: cyclesError.message },
        { status: 500 }
      );
    }

    // Get list of cycles already saved to problem bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedCycles } = await (supabase as any)
      .from('problem_bank')
      .select('original_cycle_id');

    const savedCycleIds = new Set(
      (savedCycles || []).map((s: { original_cycle_id: string }) => s.original_cycle_id)
    );

    // Transform data - include all cycles, mark which are saved and which are eligible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allCycles = (cycles || [])
      // Filter out cycles without problem statements (check refined_statement OR selected_question)
      .filter((c: { problems: Array<{ selected_question: string; refined_statement: string }> }) =>
        c.problems?.[0]?.refined_statement || c.problems?.[0]?.selected_question
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        // Use refined_statement if available, otherwise fall back to selected_question
        const problemText = c.problems?.[0]?.refined_statement || c.problems?.[0]?.selected_question || '';
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          current_step: c.current_step,
          created_at: c.created_at,
          updated_at: c.updated_at,
          user_name: c.users?.name || 'Unknown',
          user_email: c.users?.email || '',
          problem_preview: problemText.substring(0, 200) || 'No problem statement',
          is_saved: savedCycleIds.has(c.id),
          is_eligible: c.current_step >= 7, // Eligible for saving if at step 7+
        };
      });

    // Separate into categories
    const eligible = allCycles.filter((c: { is_saved: boolean; is_eligible: boolean }) => !c.is_saved && c.is_eligible);
    const inProgress = allCycles.filter((c: { is_saved: boolean; is_eligible: boolean }) => !c.is_saved && !c.is_eligible);
    const saved = allCycles.filter((c: { is_saved: boolean }) => c.is_saved);

    return NextResponse.json({
      eligible,
      in_progress: inProgress,
      saved,
      total: allCycles.length,
      already_saved: savedCycleIds.size,
    });

  } catch (error) {
    console.error('Error in GET /api/problems/eligible-cycles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
