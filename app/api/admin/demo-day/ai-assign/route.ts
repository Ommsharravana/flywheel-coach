import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  runAITrackAssignment,
  applyTrackAssignments,
  getSubmissionsForAssignment,
  getJudgingTracks,
} from '@/lib/admin/demo-day/ai-assign-services';

// GET: Run AI analysis and get track suggestions
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Run AI track assignment
    const result = await runAITrackAssignment(supabase);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in AI track assignment GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Apply selected track assignments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { assignments, apply_all_high_confidence } = body as {
      assignments?: Array<{ submission_id: string; track_id: string }>;
      apply_all_high_confidence?: boolean;
    };

    let assignmentsToApply: Array<{ submission_id: string; track_id: string }> = [];

    if (apply_all_high_confidence) {
      // Get AI suggestions and apply all high-confidence ones
      const result = await runAITrackAssignment(supabase);
      assignmentsToApply = result.suggestions
        .filter(s => s.confidence >= 80)
        .map(s => ({
          submission_id: s.submission_id,
          track_id: s.suggested_track_id,
        }));
    } else if (assignments && Array.isArray(assignments)) {
      assignmentsToApply = assignments;
    } else {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 });
    }

    if (assignmentsToApply.length === 0) {
      return NextResponse.json({ error: 'No valid assignments to apply' }, { status: 400 });
    }

    const result = await applyTrackAssignments(supabase, assignmentsToApply);

    return NextResponse.json({
      data: result,
      message: `Applied ${result.applied} track assignments`,
    });
  } catch (error) {
    console.error('Error in AI track assignment POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Get current state without AI (for manual override UI)
export async function PUT() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const [submissions, tracks] = await Promise.all([
      getSubmissionsForAssignment(supabase),
      getJudgingTracks(supabase),
    ]);

    return NextResponse.json({
      data: {
        submissions,
        tracks,
        total: submissions.length,
        assigned: submissions.filter(s => s.current_track_id).length,
        unassigned: submissions.filter(s => !s.current_track_id).length,
      },
    });
  } catch (error) {
    console.error('Error in AI track assignment PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
