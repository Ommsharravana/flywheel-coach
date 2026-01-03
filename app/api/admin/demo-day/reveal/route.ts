import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getRevealState } from '@/lib/admin/demo-day/reveal-state';
import { getLeaderboard } from '@/lib/admin/demo-day/services';

// GET: Get current reveal state and current track winners
export async function GET() {
  try {
    const supabase = await createClient();

    // Get reveal state
    const state = await getRevealState(supabase);
    if (!state) {
      return NextResponse.json({
        state: null,
        winners: [],
        tracks: [],
        trackName: '',
      });
    }

    // Get all tracks
    const { data: tracks } = (await supabase
      .from('judging_tracks')
      .select('id, name, theme')
      .order('demo_order')) as {
      data: { id: string; name: string; theme: string }[] | null;
    };

    // Get winners for current track
    let winners: Awaited<ReturnType<typeof getLeaderboard>> = [];
    let trackName = '';
    if (state.current_track_index < state.tracks_order.length) {
      const currentTrackId = state.tracks_order[state.current_track_index];
      const leaderboard = await getLeaderboard(supabase, currentTrackId);
      winners = leaderboard.slice(0, 3); // Top 3 only

      const currentTrack = tracks?.find((t) => t.id === currentTrackId);
      trackName = currentTrack?.name || '';
    }

    return NextResponse.json({
      state,
      winners,
      tracks: tracks || [],
      trackName,
    });
  } catch (error) {
    console.error('Error in reveal GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
