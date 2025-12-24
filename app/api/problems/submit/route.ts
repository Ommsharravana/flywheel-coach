import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/problems/submit - Submit a new problem directly to the bank
// All authenticated users can submit problems
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (supabase as any)
      .from('users')
      .select('institution_id, active_event_id')
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
      current_workaround,
      severity_rating,
    } = body;

    // Validate required fields
    if (!title || !problem_statement) {
      return NextResponse.json(
        { error: 'Title and problem statement are required' },
        { status: 400 }
      );
    }

    // Get event name if user has active event
    let sourceEvent = null;
    if (userProfile?.active_event_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: event } = await (supabase as any)
        .from('events')
        .select('name')
        .eq('id', userProfile.active_event_id)
        .single();
      if (event) {
        sourceEvent = event.name;
      }
    }

    // Insert into problem_bank
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newProblem, error: insertError } = await (supabase as any)
      .from('problem_bank')
      .insert({
        source_type: 'manual',
        source_year: new Date().getFullYear(),
        source_event: sourceEvent,
        event_id: userProfile?.active_event_id || null,

        title: title.substring(0, 200),
        problem_statement: problem_statement,
        theme: theme || 'other',

        who_affected: who_affected || null,
        when_occurs: when_occurs || null,
        where_occurs: where_occurs || null,
        current_workaround: current_workaround || null,
        severity_rating: severity_rating || null,

        validation_status: 'unvalidated',
        users_interviewed: 0,
        desperate_user_count: 0,

        institution_id: userProfile?.institution_id || null,
        submitted_by: user.id,

        status: 'open',
        is_open_for_attempts: true,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting problem:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit problem', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      problem_id: newProblem.id,
      message: 'Problem submitted successfully!',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/problems/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
