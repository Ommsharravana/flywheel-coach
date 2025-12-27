import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminEvents } from '@/lib/methodologies/helpers';

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

    // Check admin access and get event scope
    const adminEvents = await getAdminEvents(user.id);
    const isSuperadmin = adminEvents.some(e => e.role === 'superadmin');

    if (adminEvents.length === 0) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Get event IDs for filtering (null if superadmin sees all)
    const eventIds = isSuperadmin ? null : adminEvents.map(e => e.id);

    // Fetch ALL cycles with their problems (including all question columns)
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
        event_id,
        users!cycles_user_id_fkey (
          id,
          name,
          email,
          institution_id,
          institutions (id, name, short_name)
        ),
        problems (
          id,
          selected_question,
          refined_statement,
          q_takes_too_long,
          q_repetitive,
          q_lookup_repeatedly,
          q_complaints,
          q_would_pay
        )
      `)
      .order('updated_at', { ascending: false });

    // Apply event filtering for non-superadmin
    if (eventIds) {
      query = query.in('event_id', eventIds);
    }

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

    // Get list of cycles already saved to problem bank using RPC to bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedCycleData } = await (supabase as any).rpc('get_saved_cycle_ids', {
      caller_user_id: user.id
    });

    const savedCycleIds = new Set(
      (savedCycleData || []).map((s: { original_cycle_id: string }) => s.original_cycle_id)
    );

    // Helper to get the best available problem text from a problem record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getProblemText = (problem: any): string => {
      if (!problem) return '';
      // Priority: refined_statement > selected_question > any question answer
      return (
        problem.refined_statement ||
        problem.selected_question ||
        problem.q_takes_too_long ||
        problem.q_repetitive ||
        problem.q_lookup_repeatedly ||
        problem.q_complaints ||
        problem.q_would_pay ||
        ''
      );
    };

    // Helper to check if a problem has ANY data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasProblemData = (problem: any): boolean => {
      if (!problem) return false;
      return !!(
        problem.refined_statement ||
        problem.selected_question ||
        problem.q_takes_too_long ||
        problem.q_repetitive ||
        problem.q_lookup_repeatedly ||
        problem.q_complaints ||
        problem.q_would_pay
      );
    };

    // Auto-detect theme from problem text (aligned with Appathon 2.0 Bioconvergence Themes)
    const detectTheme = (text: string): string | null => {
      const lowerText = text.toLowerCase();

      // Healthcare + AI
      if (/health|patient|hospital|clinic|medical|doctor|nurse|pharma|drug|medicine|dental|tooth|teeth|prescription|opd|ward|diagnosis|treatment|therapy/i.test(lowerText)) {
        return 'healthcare';
      }
      // Education + AI
      if (/education|student|learner|teacher|school|college|course|exam|study|class|syllabus|grade|marks|attendance|learning|curriculum/i.test(lowerText)) {
        return 'education';
      }
      // Agriculture + AI
      if (/farm|crop|agriculture|soil|harvest|irrigation|farmer|plant|seed|pesticide|livestock|cattle|poultry|fishery/i.test(lowerText)) {
        return 'agriculture';
      }
      // Environment + AI
      if (/environment|waste|pollution|water|air|climate|sustainability|recycle|plastic|green|carbon|ecology|conservation/i.test(lowerText)) {
        return 'environment';
      }
      // Community + AI
      if (/community|social|village|society|public|welfare|volunteer|ngo|help|civic|neighborhood|local/i.test(lowerText)) {
        return 'community';
      }
      // MyJKKN Data Apps (special track)
      if (/myjkkn|jkkn|institution|campus|college management|admin|erp|portal/i.test(lowerText)) {
        return 'myjkkn';
      }

      return 'other';
    };

    // Transform data - include all cycles, mark which are saved and which are eligible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allCycles = (cycles || [])
      // Filter out cycles without ANY problem data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.problems?.[0] && hasProblemData(c.problems[0]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        const problemText = getProblemText(c.problems?.[0]);
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          current_step: c.current_step,
          created_at: c.created_at,
          updated_at: c.updated_at,
          user_name: c.users?.name || 'Unknown',
          user_email: c.users?.email || '',
          institution_id: c.users?.institution_id || null,
          institution_name: c.users?.institutions?.name || null,
          institution_short: c.users?.institutions?.short_name || null,
          problem_preview: problemText.substring(0, 200) || 'No problem statement',
          theme: detectTheme(problemText),
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
