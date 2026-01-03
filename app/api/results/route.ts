import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Active event ID - APPATHON 2.0
const ACTIVE_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';

interface Winner {
  submission_id: string;
  submission_number: string;
  app_name: string;
  team_name: string | null;
  track_id: string;
  track_name: string;
  track_theme: string;
  rank: number;
  final_score: number;
  judge_score: number;
  audience_score: number;
  bonus_percentage: number;
}

interface TrackWinners {
  track_id: string;
  track_name: string;
  track_theme: string;
  winners: Winner[];
}

interface RevealState {
  is_revealed: boolean;
  reveal_time: string | null;
  tracks: TrackWinners[];
  overall_winner: Winner | null;
}

export async function GET() {
  const supabase = await createClient();

  try {
    // Check reveal status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: revealData, error: revealError } = await (supabase as any)
      .rpc('get_results_reveal_status', { p_event_id: ACTIVE_EVENT_ID });

    if (revealError) {
      console.error('Error checking reveal status:', revealError);
      // Return not revealed if function doesn't exist yet
      return NextResponse.json({
        is_revealed: false,
        reveal_time: null,
        tracks: [],
        overall_winner: null,
      } as RevealState);
    }

    const isRevealed = revealData?.[0]?.is_revealed ?? false;
    const revealTime = revealData?.[0]?.reveal_time ?? null;

    // If not revealed, return minimal info
    if (!isRevealed) {
      return NextResponse.json({
        is_revealed: false,
        reveal_time: revealTime,
        tracks: [],
        overall_winner: null,
      } as RevealState);
    }

    // Get track winners
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tracksData, error: tracksError } = await (supabase as any)
      .rpc('get_track_winners', { p_event_id: ACTIVE_EVENT_ID });

    if (tracksError) {
      console.error('Error getting track winners:', tracksError);
      return NextResponse.json({ error: 'Failed to get track winners' }, { status: 500 });
    }

    // Get overall winner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overallData, error: overallError } = await (supabase as any)
      .rpc('get_overall_winner', { p_event_id: ACTIVE_EVENT_ID });

    if (overallError) {
      console.error('Error getting overall winner:', overallError);
      return NextResponse.json({ error: 'Failed to get overall winner' }, { status: 500 });
    }

    // Transform tracks data
    const tracks: TrackWinners[] = (tracksData || []).map((track: {
      track_id: string;
      track_name: string;
      track_theme: string;
      winners: Winner[];
    }) => ({
      track_id: track.track_id,
      track_name: track.track_name,
      track_theme: track.track_theme,
      winners: track.winners || [],
    }));

    // Transform overall winner
    const overallWinner: Winner | null = overallData?.[0] ? {
      submission_id: overallData[0].submission_id,
      submission_number: overallData[0].submission_number,
      app_name: overallData[0].app_name,
      team_name: overallData[0].team_name,
      track_id: overallData[0].track_id,
      track_name: overallData[0].track_name,
      track_theme: overallData[0].track_theme,
      rank: 1,
      final_score: overallData[0].final_score,
      judge_score: overallData[0].judge_score,
      audience_score: overallData[0].audience_score,
      bonus_percentage: overallData[0].bonus_percentage,
    } : null;

    return NextResponse.json({
      is_revealed: true,
      reveal_time: revealTime,
      tracks,
      overall_winner: overallWinner,
    } as RevealState);

  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
