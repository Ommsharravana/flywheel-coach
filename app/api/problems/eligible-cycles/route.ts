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

    // Check admin access
    const adminEvents = await getAdminEvents(user.id);
    if (adminEvents.length === 0) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Use RPC to fetch cycles - bypasses RLS infinite recursion on users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cyclesData, error: cyclesError } = await (supabase as any).rpc('get_eligible_cycles_admin', {
      caller_user_id: user.id,
      show_all: showAll
    });

    if (cyclesError) {
      console.error('Error fetching cycles:', cyclesError);
      return NextResponse.json(
        { error: 'Failed to fetch cycles', details: cyclesError.message },
        { status: 500 }
      );
    }

    // Get list of cycles already saved to problem bank using RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedCycleData } = await (supabase as any).rpc('get_saved_cycle_ids', {
      caller_user_id: user.id
    });

    const savedCycleIds = new Set(
      (savedCycleData || []).map((s: { original_cycle_id: string }) => s.original_cycle_id)
    );

    // Helper to get the best available problem text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getProblemText = (row: any): string => {
      return (
        row.refined_statement ||
        row.selected_question ||
        row.q_takes_too_long ||
        row.q_repetitive ||
        row.q_lookup_repeatedly ||
        row.q_complaints ||
        row.q_would_pay ||
        ''
      );
    };

    // Helper to check if a row has problem data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasProblemData = (row: any): boolean => {
      return !!(
        row.refined_statement ||
        row.selected_question ||
        row.q_takes_too_long ||
        row.q_repetitive ||
        row.q_lookup_repeatedly ||
        row.q_complaints ||
        row.q_would_pay
      );
    };

    // Auto-detect theme from problem text
    const detectTheme = (text: string): string => {
      const lowerText = text.toLowerCase();

      if (/health|patient|hospital|clinic|medical|doctor|nurse|pharma|drug|medicine|dental|tooth|teeth|prescription|opd|ward|diagnosis|treatment|therapy/i.test(lowerText)) {
        return 'healthcare';
      }
      if (/education|student|learner|teacher|school|college|course|exam|study|class|syllabus|grade|marks|attendance|learning|curriculum/i.test(lowerText)) {
        return 'education';
      }
      if (/farm|crop|agriculture|soil|harvest|irrigation|farmer|plant|seed|pesticide|livestock|cattle|poultry|fishery/i.test(lowerText)) {
        return 'agriculture';
      }
      if (/environment|waste|pollution|water|air|climate|sustainability|recycle|plastic|green|carbon|ecology|conservation/i.test(lowerText)) {
        return 'environment';
      }
      if (/community|social|village|society|public|welfare|volunteer|ngo|help|civic|neighborhood|local/i.test(lowerText)) {
        return 'community';
      }
      if (/myjkkn|jkkn|institution|campus|college management|admin|erp|portal/i.test(lowerText)) {
        return 'myjkkn';
      }

      return 'other';
    };

    // Transform RPC data - filter and map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allCycles = (cyclesData || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((row: any) => hasProblemData(row))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => {
        const problemText = getProblemText(row);
        return {
          id: row.id,
          name: row.name,
          status: row.status,
          current_step: row.current_step,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user_name: row.user_name || 'Unknown',
          user_email: row.user_email || '',
          institution_id: row.institution_id || null,
          institution_name: row.institution_name || null,
          institution_short: row.institution_short_name || null,
          problem_preview: problemText.substring(0, 200) || 'No problem statement',
          theme: detectTheme(problemText),
          is_saved: savedCycleIds.has(row.id),
          is_eligible: row.current_step >= 7,
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
