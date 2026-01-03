import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface VotingWindowResponse {
  isOpen: boolean;
  status: string;
  windowStartedAt: string | null;
  windowEndsAt: string | null;
  secondsRemaining: number | null;
  totalWindowSeconds: number;
  percentageRemaining: number | null;
  urgencyLevel: 'calm' | 'warning' | 'urgent' | 'critical';
  reason: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const submissionId = searchParams.get('submission_id');

  if (!submissionId) {
    return NextResponse.json(
      { error: 'submission_id is required' },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(submissionId)) {
    return NextResponse.json(
      { error: 'Invalid submission_id format' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Call the detailed voting window function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_voting_window_details', {
      p_submission_id: submissionId,
    });

    if (error) {
      console.error('Error checking voting window:', error);
      return NextResponse.json(
        { error: 'Failed to check voting window' },
        { status: 500 }
      );
    }

    // The RPC returns an array with one row
    const result = data?.[0];

    if (!result) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const response: VotingWindowResponse = {
      isOpen: result.is_open,
      status: result.status,
      windowStartedAt: result.window_started_at,
      windowEndsAt: result.window_ends_at,
      secondsRemaining: result.seconds_remaining,
      totalWindowSeconds: result.total_window_seconds,
      percentageRemaining: result.percentage_remaining,
      urgencyLevel: result.urgency_level as 'calm' | 'warning' | 'urgent' | 'critical',
      reason: result.reason,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
