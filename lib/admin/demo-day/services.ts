import { SupabaseClient } from '@supabase/supabase-js';
import type {
  TrackOverview,
  TrackSubmission,
  LeaderboardEntry,
  DemoDayState,
  JudgingTrack,
  TrackJudge,
} from './types';

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';

// Get all tracks with their current state
export async function getTrackOverviews(
  supabase: SupabaseClient
): Promise<TrackOverview[]> {
  // Get all tracks for the event
  const { data: tracks, error: tracksError } = await supabase
    .from('judging_tracks')
    .select('*')
    .eq('event_id', APPATHON_EVENT_ID)
    .order('demo_order');

  if (tracksError) {
    console.error('Error fetching tracks:', tracksError);
    throw new Error('Failed to fetch tracks');
  }

  const trackOverviews: TrackOverview[] = [];

  for (const track of tracks || []) {
    // Get submission counts for this track
    const { data: assignments, error: assignError } = await supabase
      .from('submission_track_assignments')
      .select(`
        id,
        submission_id,
        demo_slot,
        status,
        appathon_submissions!inner (
          id,
          submission_number,
          app_name,
          category,
          status
        )
      `)
      .eq('track_id', track.id)
      .order('demo_slot', { ascending: true, nullsFirst: false });

    if (assignError) {
      console.error('Error fetching assignments for track:', track.id, assignError);
      continue;
    }

    // Get judges for this track
    const { data: judges, error: judgesError } = await supabase
      .from('track_judges')
      .select(`
        id,
        track_id,
        user_id,
        is_lead,
        assigned_at,
        users!inner (
          id,
          name,
          email
        )
      `)
      .eq('track_id', track.id);

    if (judgesError) {
      console.error('Error fetching judges for track:', track.id, judgesError);
    }

    const pending = (assignments || []).filter(a => a.status === 'pending').length;
    const presenting = (assignments || []).filter(a => a.status === 'presenting').length;
    const completed = (assignments || []).filter(a => a.status === 'completed').length;
    const skipped = (assignments || []).filter(a => a.status === 'skipped').length;

    // Find current presenter
    const currentPresenterAssignment = (assignments || []).find(a => a.status === 'presenting');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentPresenter = currentPresenterAssignment ? {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      submission_id: (currentPresenterAssignment.appathon_submissions as any).id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      app_name: (currentPresenterAssignment.appathon_submissions as any).app_name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      submission_number: (currentPresenterAssignment.appathon_submissions as any).submission_number,
      demo_slot: currentPresenterAssignment.demo_slot || 0,
    } : null;

    // Determine track status
    let status: TrackOverview['status'] = 'not-started';
    if (!track.is_active) {
      status = 'completed';
    } else if (presenting > 0) {
      status = 'in-progress';
    } else if (completed > 0 && pending > 0) {
      status = 'in-progress';
    } else if (completed === (assignments || []).length && completed > 0) {
      status = 'completed';
    }

    trackOverviews.push({
      id: track.id,
      name: track.name,
      theme: track.theme,
      room_location: track.room_location,
      is_active: track.is_active,
      total_submissions: (assignments || []).length,
      pending_count: pending,
      presenting_count: presenting,
      completed_count: completed,
      skipped_count: skipped,
      current_presenter: currentPresenter,
      judges: (judges || []).map(j => ({
        id: j.id,
        track_id: j.track_id,
        user_id: j.user_id,
        is_lead: j.is_lead,
        assigned_at: j.assigned_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: j.users as any,
      })),
      status,
    });
  }

  return trackOverviews;
}

// Get full demo day state
export async function getDemoDayState(
  supabase: SupabaseClient
): Promise<DemoDayState> {
  const tracks = await getTrackOverviews(supabase);

  // Get total votes
  const { count: voteCount } = await supabase
    .from('audience_votes')
    .select('id', { count: 'exact', head: true });

  // Get total judges
  const { count: judgeCount } = await supabase
    .from('track_judges')
    .select('id', { count: 'exact', head: true })
    .in('track_id', tracks.map(t => t.id));

  const totalSubmissions = tracks.reduce((acc, t) => acc + t.total_submissions, 0);
  const totalCompleted = tracks.reduce((acc, t) => acc + t.completed_count, 0);

  // Check if any track has results revealed (we can add a column for this later)
  const allTracksComplete = tracks.every(t => !t.is_active);
  const anyTrackActive = tracks.some(t => t.is_active && t.status === 'in-progress');

  return {
    event_id: APPATHON_EVENT_ID,
    is_live: anyTrackActive,
    results_revealed: allTracksComplete,
    is_paused: false, // Can implement pause functionality
    tracks,
    total_submissions: totalSubmissions,
    total_completed: totalCompleted,
    total_judges: judgeCount || 0,
    total_votes: voteCount || 0,
  };
}

// Get submissions for a specific track
export async function getTrackSubmissions(
  supabase: SupabaseClient,
  trackId: string
): Promise<TrackSubmission[]> {
  // Get track info first to get judge count
  const { data: trackJudges } = await supabase
    .from('track_judges')
    .select('id')
    .eq('track_id', trackId);

  const judgeTarget = (trackJudges || []).length;

  // Get assignments with submission details
  const { data: assignments, error } = await supabase
    .from('submission_track_assignments')
    .select(`
      id,
      submission_id,
      demo_slot,
      status,
      appathon_submissions!inner (
        id,
        submission_number,
        app_name,
        category,
        status,
        user_id,
        users!inner (
          id,
          name,
          email,
          institution
        )
      )
    `)
    .eq('track_id', trackId)
    .order('demo_slot', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching track submissions:', error);
    throw new Error('Failed to fetch track submissions');
  }

  const submissions: TrackSubmission[] = [];

  for (const assignment of assignments || []) {
    // Get judge scores for this submission
    const { data: scores } = await supabase
      .from('judge_scores')
      .select('id, submitted_at')
      .eq('submission_id', assignment.submission_id);

    // Get audience votes
    const { data: votes } = await supabase
      .from('audience_votes')
      .select('rating')
      .eq('submission_id', assignment.submission_id);

    const judgesCompleted = (scores || []).filter(s => s.submitted_at).length;
    const avgRating = votes && votes.length > 0
      ? votes.reduce((acc, v) => acc + v.rating, 0) / votes.length
      : null;

    // Get final score from view
    const { data: finalScore } = await supabase
      .from('submission_final_scores')
      .select('final_score')
      .eq('submission_id', assignment.submission_id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = assignment.appathon_submissions as any;
    submissions.push({
      id: assignment.id,
      submission_id: assignment.submission_id,
      submission_number: sub.submission_number,
      app_name: sub.app_name,
      category: sub.category,
      demo_slot: assignment.demo_slot,
      status: assignment.status as TrackSubmission['status'],
      judge_count: (scores || []).length,
      judge_target: judgeTarget,
      judges_completed: judgesCompleted,
      audience_vote_count: (votes || []).length,
      audience_avg_rating: avgRating,
      final_score: finalScore?.final_score || null,
      user: sub.users ? {
        name: sub.users.name,
        email: sub.users.email,
        institution: sub.users.institution,
      } : undefined,
    });
  }

  return submissions;
}

// Get leaderboard for all tracks
export async function getLeaderboard(
  supabase: SupabaseClient,
  trackId?: string
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('track_leaderboards')
    .select('*')
    .order('track_name')
    .order('rank');

  if (trackId) {
    query = query.eq('track_id', trackId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error('Failed to fetch leaderboard');
  }

  return (data || []).map(entry => ({
    submission_id: entry.submission_id,
    submission_number: entry.submission_number,
    app_name: entry.app_name,
    category: entry.category || '',
    track_id: entry.track_id,
    track_name: entry.track_name,
    avg_judge_score: entry.avg_judge_score || 0,
    audience_score: entry.audience_score || 0,
    avg_bonus: entry.avg_bonus || 0,
    final_score: entry.final_score || 0,
    judge_count: entry.judge_count || 0,
    vote_count: entry.vote_count || 0,
    rank: entry.rank || 0,
  }));
}

// Admin actions

export async function advancePresenter(
  supabase: SupabaseClient,
  trackId: string,
  submissionId?: string
): Promise<void> {
  // If submission ID provided, set it to presenting and complete the current one
  if (submissionId) {
    // Complete current presenter
    await supabase
      .from('submission_track_assignments')
      .update({ status: 'completed' })
      .eq('track_id', trackId)
      .eq('status', 'presenting');

    // Set new presenter
    await supabase
      .from('submission_track_assignments')
      .update({ status: 'presenting' })
      .eq('track_id', trackId)
      .eq('submission_id', submissionId);
  } else {
    // Get next pending submission in order
    const { data: current } = await supabase
      .from('submission_track_assignments')
      .select('id, demo_slot')
      .eq('track_id', trackId)
      .eq('status', 'presenting')
      .single();

    // Complete current if exists
    if (current) {
      await supabase
        .from('submission_track_assignments')
        .update({ status: 'completed' })
        .eq('id', current.id);
    }

    // Get next pending
    const { data: next } = await supabase
      .from('submission_track_assignments')
      .select('id')
      .eq('track_id', trackId)
      .eq('status', 'pending')
      .order('demo_slot', { ascending: true, nullsFirst: false })
      .limit(1)
      .single();

    if (next) {
      await supabase
        .from('submission_track_assignments')
        .update({ status: 'presenting' })
        .eq('id', next.id);
    }
  }
}

export async function skipTeam(
  supabase: SupabaseClient,
  trackId: string,
  submissionId: string,
  reason?: string
): Promise<void> {
  await supabase
    .from('submission_track_assignments')
    .update({ status: 'skipped' })
    .eq('track_id', trackId)
    .eq('submission_id', submissionId);

  // Log the skip with reason
  console.log(`Team ${submissionId} skipped. Reason: ${reason || 'No-show'}`);
}

export async function moveToEnd(
  supabase: SupabaseClient,
  trackId: string,
  submissionId: string
): Promise<void> {
  // Get the highest demo_slot
  const { data: lastSlot } = await supabase
    .from('submission_track_assignments')
    .select('demo_slot')
    .eq('track_id', trackId)
    .order('demo_slot', { ascending: false })
    .limit(1)
    .single();

  const newSlot = (lastSlot?.demo_slot || 0) + 1;

  // If currently presenting, revert to pending
  await supabase
    .from('submission_track_assignments')
    .update({
      status: 'pending',
      demo_slot: newSlot
    })
    .eq('track_id', trackId)
    .eq('submission_id', submissionId);
}

export async function closeTrack(
  supabase: SupabaseClient,
  trackId: string
): Promise<void> {
  // Mark all remaining pending as completed
  await supabase
    .from('submission_track_assignments')
    .update({ status: 'completed' })
    .eq('track_id', trackId)
    .in('status', ['pending', 'presenting']);

  // Deactivate the track
  await supabase
    .from('judging_tracks')
    .update({ is_active: false })
    .eq('id', trackId);
}

export async function reopenTrack(
  supabase: SupabaseClient,
  trackId: string
): Promise<void> {
  await supabase
    .from('judging_tracks')
    .update({ is_active: true })
    .eq('id', trackId);
}

export async function reorderSubmissions(
  supabase: SupabaseClient,
  trackId: string,
  orderedSubmissionIds: string[]
): Promise<void> {
  // Update demo_slot for each submission
  for (let i = 0; i < orderedSubmissionIds.length; i++) {
    await supabase
      .from('submission_track_assignments')
      .update({ demo_slot: i + 1 })
      .eq('track_id', trackId)
      .eq('submission_id', orderedSubmissionIds[i]);
  }
}

// Export results to CSV format
export async function exportResults(
  supabase: SupabaseClient,
  trackId?: string
): Promise<string> {
  const leaderboard = await getLeaderboard(supabase, trackId);

  // CSV header
  const header = [
    'Rank',
    'Track',
    'Submission #',
    'App Name',
    'Category',
    'Judge Score',
    'Audience Score',
    'Bonus %',
    'Final Score',
    'Judges',
    'Votes'
  ].join(',');

  const rows = leaderboard.map(entry => [
    entry.rank,
    `"${entry.track_name}"`,
    entry.submission_number,
    `"${entry.app_name}"`,
    `"${entry.category}"`,
    entry.avg_judge_score.toFixed(2),
    entry.audience_score.toFixed(2),
    entry.avg_bonus.toFixed(1),
    entry.final_score.toFixed(2),
    entry.judge_count,
    entry.vote_count
  ].join(','));

  return [header, ...rows].join('\n');
}
