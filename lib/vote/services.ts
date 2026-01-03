import { createClient } from '@/lib/supabase/client';
import type { PresentingSubmission, UserTrackInfo, AudienceVote, Reaction, VotingWindowStatus } from './types';

// ============================================
// AUDIENCE VOTING SERVICES
// ============================================

/**
 * Get user's track assignment based on their submission
 */
export async function getUserTrackInfo(userId: string): Promise<UserTrackInfo | null> {
  const supabase = createClient();

  // Get user's submission and its track assignment
  const { data, error } = await supabase
    .from('appathon_submissions')
    .select(`
      id,
      submission_track_assignments!inner (
        track_id,
        judging_tracks!inner (
          id,
          name,
          theme,
          room_location
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .single();

  if (error || !data) {
    console.error('Error getting user track info:', error);
    return null;
  }

  const assignment = (data as {
    id: string;
    submission_track_assignments: Array<{
      track_id: string;
      judging_tracks: {
        id: string;
        name: string;
        theme: string;
        room_location: string | null;
      };
    }>;
  }).submission_track_assignments[0];

  if (!assignment) return null;

  return {
    track_id: assignment.track_id,
    track_name: assignment.judging_tracks.name,
    theme: assignment.judging_tracks.theme,
    room_location: assignment.judging_tracks.room_location,
    submission_id: data.id,
  };
}

/**
 * Get currently presenting submission in a track
 */
export async function getCurrentlyPresenting(trackId: string): Promise<PresentingSubmission | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('submission_track_assignments')
    .select(`
      demo_slot,
      status,
      track_id,
      judging_tracks!inner (
        id,
        name
      ),
      appathon_submissions!inner (
        id,
        submission_number,
        app_name,
        category,
        description,
        app_url,
        user_id,
        users!inner (
          name
        )
      )
    `)
    .eq('track_id', trackId)
    .eq('status', 'presenting')
    .single();

  if (error || !data) {
    // No one presenting currently
    return null;
  }

  const typedData = data as {
    demo_slot: number | null;
    status: 'presenting';
    track_id: string;
    judging_tracks: { id: string; name: string };
    appathon_submissions: {
      id: string;
      submission_number: string;
      app_name: string;
      category: string;
      description: string | null;
      app_url: string | null;
      user_id: string;
      users: { name: string | null };
    };
  };

  return {
    id: typedData.appathon_submissions.id,
    submission_number: typedData.appathon_submissions.submission_number,
    app_name: typedData.appathon_submissions.app_name,
    category: typedData.appathon_submissions.category,
    description: typedData.appathon_submissions.description,
    app_url: typedData.appathon_submissions.app_url,
    user_id: typedData.appathon_submissions.user_id,
    user_name: typedData.appathon_submissions.users.name,
    track_id: typedData.track_id,
    track_name: typedData.judging_tracks.name,
    demo_slot: typedData.demo_slot,
    status: typedData.status,
  };
}

/**
 * Check if user has already voted for a submission
 */
export async function hasUserVoted(submissionId: string, voterId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('audience_votes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('voter_id', voterId)
    .maybeSingle();

  if (error) {
    console.error('Error checking vote:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get user's existing vote for a submission
 */
export async function getUserVote(submissionId: string, voterId: string): Promise<AudienceVote | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('audience_votes')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('voter_id', voterId)
    .maybeSingle();

  if (error) {
    console.error('Error getting vote:', error);
    return null;
  }

  return data as AudienceVote | null;
}

/**
 * Check if voting window is open for a submission
 */
export async function getVotingWindowStatus(submissionId: string): Promise<VotingWindowStatus> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('is_voting_open', {
    p_submission_id: submissionId,
  });

  if (error) {
    console.error('Error checking voting window:', error);
    return {
      is_open: false,
      window_started_at: null,
      seconds_remaining: null,
      reason: 'Failed to check voting status',
    };
  }

  const result = data?.[0];
  return {
    is_open: result?.is_open ?? false,
    window_started_at: result?.window_started_at ?? null,
    seconds_remaining: result?.seconds_remaining ?? null,
    reason: result?.reason ?? 'Unknown',
  };
}

/**
 * Submit a vote for a submission
 */
export async function submitVote(
  submissionId: string,
  voterId: string,
  rating: number,
  reaction?: Reaction
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // First check if voting window is open
  const windowStatus = await getVotingWindowStatus(submissionId);
  if (!windowStatus.is_open) {
    return {
      success: false,
      error: windowStatus.reason || 'Voting window is closed',
    };
  }

  // Get device type
  const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop';

  const { error } = await supabase
    .from('audience_votes')
    .upsert({
      submission_id: submissionId,
      voter_id: voterId,
      rating,
      reaction: reaction || null,
      device_type: deviceType,
      voted_at: new Date().toISOString(),
    }, {
      onConflict: 'submission_id,voter_id',
    });

  if (error) {
    console.error('Error submitting vote:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the queue of upcoming presentations in a track
 */
export async function getTrackQueue(trackId: string): Promise<PresentingSubmission[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('submission_track_assignments')
    .select(`
      demo_slot,
      status,
      track_id,
      judging_tracks!inner (
        id,
        name
      ),
      appathon_submissions!inner (
        id,
        submission_number,
        app_name,
        category,
        description,
        app_url,
        user_id,
        users!inner (
          name
        )
      )
    `)
    .eq('track_id', trackId)
    .in('status', ['pending', 'presenting'])
    .order('demo_slot', { ascending: true });

  if (error || !data) {
    console.error('Error getting track queue:', error);
    return [];
  }

  return (data as Array<{
    demo_slot: number | null;
    status: 'pending' | 'presenting';
    track_id: string;
    judging_tracks: { id: string; name: string };
    appathon_submissions: {
      id: string;
      submission_number: string;
      app_name: string;
      category: string;
      description: string | null;
      app_url: string | null;
      user_id: string;
      users: { name: string | null };
    };
  }>).map(item => ({
    id: item.appathon_submissions.id,
    submission_number: item.appathon_submissions.submission_number,
    app_name: item.appathon_submissions.app_name,
    category: item.appathon_submissions.category,
    description: item.appathon_submissions.description,
    app_url: item.appathon_submissions.app_url,
    user_id: item.appathon_submissions.user_id,
    user_name: item.appathon_submissions.users.name,
    track_id: item.track_id,
    track_name: item.judging_tracks.name,
    demo_slot: item.demo_slot,
    status: item.status,
  }));
}
