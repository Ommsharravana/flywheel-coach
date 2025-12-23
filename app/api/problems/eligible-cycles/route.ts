import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/problems/eligible-cycles - Get cycles that can be saved to problem bank
export async function GET() {
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

    // Fetch cycles that are eligible for saving to problem bank:
    // - current_step >= 7 (at Impact Discovery or beyond)
    // - NOT already saved to problem bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cycles, error: cyclesError } = await (supabase as any)
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
        problems (id, what_problem)
      `)
      .gte('current_step', 7)
      .order('updated_at', { ascending: false });

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

    // Filter out already saved cycles and transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eligibleCycles = (cycles || [])
      .filter((c: { id: string }) => !savedCycleIds.has(c.id))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        current_step: c.current_step,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user_name: c.users?.name || 'Unknown',
        user_email: c.users?.email || '',
        problem_preview: c.problems?.[0]?.what_problem?.substring(0, 150) || 'No problem statement',
      }));

    return NextResponse.json({
      eligible: eligibleCycles,
      total: eligibleCycles.length,
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
