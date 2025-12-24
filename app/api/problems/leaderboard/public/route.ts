import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/problems/leaderboard/public - Public institution leaderboard (no auth required)
// Supports event scoping via ?event=appathon-2 query parameter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const eventSlug = searchParams.get('event') || 'appathon-2'; // Default to Appathon 2.0

    // First, get the event ID from slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .select('id, name, slug')
      .eq('slug', eventSlug)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get cycles for this event, grouped by institution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cycleData, error: cycleError } = await (supabase as any)
      .from('cycles')
      .select(`
        id,
        current_step,
        status,
        event_id,
        user_id,
        users!cycles_user_id_fkey (
          institution_id,
          active_event_id,
          institutions (id, name, short_name)
        ),
        problems (
          refined_statement,
          selected_question,
          q_takes_too_long,
          q_repetitive,
          q_lookup_repeatedly,
          q_complaints,
          q_would_pay
        )
      `)
      .or(`event_id.eq.${event.id},event_id.is.null`);

    if (cycleError) {
      console.error('Error fetching cycles:', cycleError);
      return NextResponse.json({ error: 'Failed to fetch cycle data' }, { status: 500 });
    }

    // Get saved problems from problem_bank for this event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedProblems } = await (supabase as any)
      .from('problem_bank')
      .select('institution_id, status, validation_status, event_id')
      .or(`event_id.eq.${event.id},event_id.is.null`);

    // Aggregate by institution
    const institutionStats: Record<
      string,
      {
        id: string;
        name: string;
        short_name: string;
        total_cycles: number;
        completed_cycles: number;
        problems_identified: number;
        problems_saved: number;
        problems_solved: number;
        problems_validated: number;
      }
    > = {};

    // Process cycles - only include those where user is in this event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cycleData || []).forEach((c: any) => {
      const instId = c.users?.institution_id;
      const inst = c.users?.institutions;
      const userEventId = c.users?.active_event_id;

      // Filter: cycle must be for this event OR user must be in this event
      if (c.event_id !== event.id && userEventId !== event.id) return;
      if (!instId || !inst) return;

      if (!institutionStats[instId]) {
        institutionStats[instId] = {
          id: instId,
          name: inst.name,
          short_name: inst.short_name || inst.name,
          total_cycles: 0,
          completed_cycles: 0,
          problems_identified: 0,
          problems_saved: 0,
          problems_solved: 0,
          problems_validated: 0,
        };
      }

      institutionStats[instId].total_cycles++;

      if (c.current_step >= 7) {
        institutionStats[instId].completed_cycles++;
      }

      // Check if problem has any content
      const problem = c.problems?.[0];
      if (
        problem &&
        (problem.refined_statement ||
          problem.selected_question ||
          problem.q_takes_too_long ||
          problem.q_repetitive ||
          problem.q_lookup_repeatedly ||
          problem.q_complaints ||
          problem.q_would_pay)
      ) {
        institutionStats[instId].problems_identified++;
      }
    });

    // Process saved problems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (savedProblems || []).forEach((p: any) => {
      if (!p.institution_id || !institutionStats[p.institution_id]) return;

      institutionStats[p.institution_id].problems_saved++;

      if (p.status === 'solved') {
        institutionStats[p.institution_id].problems_solved++;
      }

      if (
        p.validation_status === 'desperate_user_confirmed' ||
        p.validation_status === 'market_validated'
      ) {
        institutionStats[p.institution_id].problems_validated++;
      }
    });

    // Convert to array and sort by problems_identified (primary), then completed_cycles
    const leaderboard = Object.values(institutionStats).sort((a, b) => {
      if (b.problems_identified !== a.problems_identified) {
        return b.problems_identified - a.problems_identified;
      }
      return b.completed_cycles - a.completed_cycles;
    });

    // Calculate totals
    const totals = {
      total_cycles: leaderboard.reduce((sum, i) => sum + i.total_cycles, 0),
      completed_cycles: leaderboard.reduce((sum, i) => sum + i.completed_cycles, 0),
      problems_identified: leaderboard.reduce((sum, i) => sum + i.problems_identified, 0),
      problems_saved: leaderboard.reduce((sum, i) => sum + i.problems_saved, 0),
      institutions: leaderboard.length,
    };

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
      },
      leaderboard,
      totals,
    });
  } catch (error) {
    console.error('Error in GET /api/problems/leaderboard/public:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
