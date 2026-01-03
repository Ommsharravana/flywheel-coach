import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type {
  CommandCenterState,
  CommandCenterTrack,
  JudgeActivity,
  JudgeScorePattern,
  TrackScoreDistribution,
  CommandCenterAlert,
} from '@/lib/admin/demo-day/command-center-types';
import { getTrackOverviews } from '@/lib/admin/demo-day/services';

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';
const INACTIVE_THRESHOLD_MINUTES = 20;
const DEMO_DURATION_MINUTES = 7; // Expected demo duration

// GET: Get command center state with real-time monitoring data
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify superadmin role using RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRole } = await (supabase as any).rpc('get_current_user_role');

    if (userRole !== 'superadmin' && userRole !== 'event_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get base track overviews
    const trackOverviews = await getTrackOverviews(supabase);

    // Get judge activities
    const judgeActivities = await getJudgeActivities(supabase, trackOverviews);

    // Get score patterns and anomalies
    const { scorePatterns, trackDistributions } = await getScoreAnalysis(supabase, trackOverviews);

    // Generate alerts
    const alerts = generateAlerts(trackOverviews, judgeActivities, scorePatterns);

    // Enhance tracks with command center data
    const commandCenterTracks = await enhanceTracksWithTiming(supabase, trackOverviews);

    // Calculate totals
    const totalSubmissions = commandCenterTracks.reduce((acc, t) => acc + t.total_submissions, 0);
    const totalCompleted = commandCenterTracks.reduce((acc, t) => acc + t.completed_count, 0);
    const totalPending = commandCenterTracks.reduce((acc, t) => acc + t.pending_count, 0);
    const totalPresenting = commandCenterTracks.reduce((acc, t) => acc + t.presenting_count, 0);
    const overallProgress = totalSubmissions > 0 ? Math.round((totalCompleted / totalSubmissions) * 100) : 0;

    const activeJudges = judgeActivities.filter(j => j.status === 'active').length;
    const inactiveJudges = judgeActivities.filter(j => j.is_inactive).length;
    const judgesNeedingAttention = judgeActivities.filter(j => j.is_inactive || j.status === 'never-scored');

    const state: CommandCenterState = {
      event_id: APPATHON_EVENT_ID,
      fetched_at: new Date().toISOString(),

      tracks: commandCenterTracks,
      total_submissions: totalSubmissions,
      total_completed: totalCompleted,
      total_pending: totalPending,
      total_presenting: totalPresenting,
      overall_progress_percent: overallProgress,

      judge_activities: judgeActivities,
      total_judges: judgeActivities.length,
      active_judges: activeJudges,
      inactive_judges: inactiveJudges,
      judges_needing_attention: judgesNeedingAttention,

      score_patterns: scorePatterns,
      track_distributions: trackDistributions,
      anomalies_detected: scorePatterns.filter(p => p.is_anomaly).length,

      alerts,
    };

    return NextResponse.json({ data: state, success: true });
  } catch (error) {
    console.error('Error in command-center GET:', error);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
}

// Helper: Get judge activities with last score timestamps
async function getJudgeActivities(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  tracks: Awaited<ReturnType<typeof getTrackOverviews>>
): Promise<JudgeActivity[]> {
  const activities: JudgeActivity[] = [];
  const now = new Date();

  for (const track of tracks) {
    for (const judge of track.judges) {
      // Get last score for this judge in this track
      const { data: lastScoreData } = await supabase
        .from('judge_scores')
        .select('submitted_at, created_at')
        .eq('judge_id', judge.user_id)
        .eq('track_id', track.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastScore = (lastScoreData as any)?.[0] || null;

      // Get total scores submitted
      const { count: scoreCount } = await supabase
        .from('judge_scores')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', judge.user_id)
        .eq('track_id', track.id)
        .not('submitted_at', 'is', null);

      const lastActivityTime = lastScore?.submitted_at ? new Date(lastScore.submitted_at) : null;
      const minutesSinceActivity = lastActivityTime
        ? Math.floor((now.getTime() - lastActivityTime.getTime()) / 60000)
        : null;

      let status: JudgeActivity['status'] = 'never-scored';
      if (lastActivityTime) {
        if (minutesSinceActivity !== null && minutesSinceActivity <= 5) {
          status = 'active';
        } else if (minutesSinceActivity !== null && minutesSinceActivity <= INACTIVE_THRESHOLD_MINUTES) {
          status = 'idle';
        } else {
          status = 'inactive';
        }
      }

      const isInactive = minutesSinceActivity !== null && minutesSinceActivity > INACTIVE_THRESHOLD_MINUTES;

      activities.push({
        judge_id: judge.user_id,
        judge_name: judge.user?.name || null,
        judge_email: judge.user?.email || 'Unknown',
        track_id: track.id,
        track_name: track.name,
        is_lead: judge.is_lead,
        last_score_at: lastScore?.submitted_at || null,
        total_scores_submitted: scoreCount || 0,
        minutes_since_last_activity: minutesSinceActivity,
        is_inactive: isInactive,
        status,
      });
    }
  }

  return activities;
}

// Helper: Get score patterns and anomalies
async function getScoreAnalysis(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  tracks: Awaited<ReturnType<typeof getTrackOverviews>>
): Promise<{ scorePatterns: JudgeScorePattern[]; trackDistributions: TrackScoreDistribution[] }> {
  const scorePatterns: JudgeScorePattern[] = [];
  const trackDistributions: TrackScoreDistribution[] = [];

  for (const track of tracks) {
    // Get all scores for this track
    const { data: trackScoresData } = await supabase
      .from('judge_scores')
      .select(`
        id,
        judge_id,
        submission_id,
        total_score,
        weighted_score,
        submitted_at,
        users!judge_scores_judge_id_fkey (
          id,
          name,
          email
        ),
        appathon_submissions!inner (
          id,
          app_name
        )
      `)
      .eq('track_id', track.id)
      .not('submitted_at', 'is', null);

    if (!trackScoresData || trackScoresData.length === 0) continue;

    // Cast to any to work around complex join type inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackScores = trackScoresData as any[];

    // Calculate track-level distribution
    const allScores = trackScores
      .map((s: { weighted_score: number | null; total_score: number | null }) => s.weighted_score || s.total_score)
      .filter((s): s is number => s !== null);

    if (allScores.length > 0) {
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const variance = allScores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / allScores.length;
      const stdDev = Math.sqrt(variance);

      // Create score buckets
      const buckets = [
        { range: '0-20', min: 0, max: 20, count: 0 },
        { range: '21-40', min: 21, max: 40, count: 0 },
        { range: '41-60', min: 41, max: 60, count: 0 },
        { range: '61-80', min: 61, max: 80, count: 0 },
        { range: '81-100', min: 81, max: 100, count: 0 },
      ];

      for (const score of allScores) {
        for (const bucket of buckets) {
          if (score >= bucket.min && score <= bucket.max) {
            bucket.count++;
            break;
          }
        }
      }

      // Find outliers (>2 std dev from mean)
      const outlierThreshold = 2;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submissionScores = new Map<string, { scores: number[]; appName: string }>();

      for (const score of trackScores) {
        const scoreValue = score.weighted_score || score.total_score;
        if (scoreValue === null) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = score.appathon_submissions as any;
        if (!submissionScores.has(score.submission_id)) {
          submissionScores.set(score.submission_id, { scores: [], appName: sub?.app_name || 'Unknown' });
        }
        submissionScores.get(score.submission_id)!.scores.push(scoreValue);
      }

      const outliers: TrackScoreDistribution['outliers'] = [];
      for (const [subId, data] of submissionScores.entries()) {
        const subAvg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const deviationFromMean = (subAvg - avgScore) / (stdDev || 1);
        if (Math.abs(deviationFromMean) > outlierThreshold) {
          outliers.push({
            submission_id: subId,
            app_name: data.appName,
            avg_score: subAvg,
            deviation_from_mean: deviationFromMean,
          });
        }
      }

      trackDistributions.push({
        track_id: track.id,
        track_name: track.name,
        total_scores: allScores.length,
        avg_score: avgScore,
        std_dev: stdDev,
        score_buckets: buckets.map(b => ({
          range: b.range,
          count: b.count,
          percentage: allScores.length > 0 ? Math.round((b.count / allScores.length) * 100) : 0,
        })),
        outliers: outliers.sort((a, b) => Math.abs(b.deviation_from_mean) - Math.abs(a.deviation_from_mean)),
      });
    }

    // Analyze per-judge patterns
    const judgeScoresMap = new Map<string, { scores: number[]; judge: { name: string | null; email: string } }>();

    for (const score of trackScores) {
      const scoreValue = score.weighted_score || score.total_score;
      if (scoreValue === null) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const judgeUser = score.users as any;
      if (!judgeScoresMap.has(score.judge_id)) {
        judgeScoresMap.set(score.judge_id, {
          scores: [],
          judge: { name: judgeUser?.name || null, email: judgeUser?.email || 'Unknown' },
        });
      }
      judgeScoresMap.get(score.judge_id)!.scores.push(scoreValue);
    }

    for (const [judgeId, data] of judgeScoresMap.entries()) {
      const scores = data.scores;
      if (scores.length === 0) continue;

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const variance = scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      const allSameScore = stdDev === 0 && scores.length > 1;
      const allMaxScores = scores.every(s => s >= 95); // Near-perfect scores
      const allMinScores = scores.every(s => s <= 20); // Very low scores

      let isAnomaly = false;
      let anomalyReason: string | null = null;

      if (allSameScore && scores.length >= 3) {
        isAnomaly = true;
        anomalyReason = `Gave identical scores (${scores[0].toFixed(0)}) to all ${scores.length} submissions`;
      } else if (allMaxScores && scores.length >= 3) {
        isAnomaly = true;
        anomalyReason = `Gave near-perfect scores (95+) to all ${scores.length} submissions`;
      } else if (allMinScores && scores.length >= 3) {
        isAnomaly = true;
        anomalyReason = `Gave very low scores (<20) to all ${scores.length} submissions`;
      } else if (stdDev < 2 && scores.length >= 5) {
        isAnomaly = true;
        anomalyReason = `Very low score variation (std dev: ${stdDev.toFixed(1)}) across ${scores.length} submissions`;
      }

      scorePatterns.push({
        judge_id: judgeId,
        judge_name: data.judge.name,
        judge_email: data.judge.email,
        track_name: track.name,
        scores_given: scores.length,
        avg_score: avgScore,
        min_score: minScore,
        max_score: maxScore,
        std_dev: stdDev,
        all_same_score: allSameScore,
        all_max_scores: allMaxScores,
        all_min_scores: allMinScores,
        is_anomaly: isAnomaly,
        anomaly_reason: anomalyReason,
      });
    }
  }

  return { scorePatterns, trackDistributions };
}

// Helper: Enhance tracks with timing data
async function enhanceTracksWithTiming(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  tracks: Awaited<ReturnType<typeof getTrackOverviews>>
): Promise<CommandCenterTrack[]> {
  const enhancedTracks: CommandCenterTrack[] = [];
  const now = new Date();

  for (const track of tracks) {
    // Get presenter timing if there's a current presenter
    let presenterStartedAt: string | null = null;
    let presenterElapsedMinutes: number | null = null;

    if (track.current_presenter) {
      // Check for when the status was changed to 'presenting'
      const { data: presentingAssignmentData } = await supabase
        .from('submission_track_assignments')
        .select('updated_at')
        .eq('track_id', track.id)
        .eq('submission_id', track.current_presenter.submission_id)
        .eq('status', 'presenting')
        .limit(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const presentingAssignment = (presentingAssignmentData as any)?.[0];

      if (presentingAssignment?.updated_at) {
        presenterStartedAt = presentingAssignment.updated_at;
        const startTime = new Date(presentingAssignment.updated_at);
        presenterElapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      }
    }

    // Calculate schedule status
    const demosCompleted = track.completed_count;
    const totalDemos = track.total_submissions;
    const demosRemaining = totalDemos - demosCompleted - (track.presenting_count > 0 ? 1 : 0);

    // Assume track started at beginning of day (or we could store this)
    const avgDemoDuration = demosCompleted > 0 ? DEMO_DURATION_MINUTES : null;
    const estimatedMinutesRemaining = demosRemaining * DEMO_DURATION_MINUTES;
    const estimatedEndTime = new Date(now.getTime() + estimatedMinutesRemaining * 60000);

    // Check if behind schedule (>10 minutes over expected per demo)
    const isBehindSchedule = presenterElapsedMinutes !== null && presenterElapsedMinutes > DEMO_DURATION_MINUTES + 5;
    const minutesBehind = isBehindSchedule && presenterElapsedMinutes
      ? presenterElapsedMinutes - DEMO_DURATION_MINUTES
      : 0;

    // Calculate demos per hour (if we have completed demos)
    const demosPerHour = demosCompleted > 0 ? Math.round(60 / DEMO_DURATION_MINUTES) : null;

    enhancedTracks.push({
      ...track,
      estimated_end_time: estimatedEndTime.toISOString(),
      avg_demo_duration_minutes: avgDemoDuration,
      is_behind_schedule: isBehindSchedule,
      minutes_behind: minutesBehind,
      demos_per_hour: demosPerHour,
      presenter_started_at: presenterStartedAt,
      presenter_elapsed_minutes: presenterElapsedMinutes,
    });
  }

  return enhancedTracks;
}

// Helper: Generate alerts based on current state
function generateAlerts(
  tracks: Awaited<ReturnType<typeof getTrackOverviews>>,
  judgeActivities: JudgeActivity[],
  scorePatterns: JudgeScorePattern[]
): CommandCenterAlert[] {
  const alerts: CommandCenterAlert[] = [];
  const now = new Date();

  // Check for inactive judges
  for (const judge of judgeActivities) {
    if (judge.is_inactive && judge.status !== 'never-scored') {
      alerts.push({
        id: `judge-inactive-${judge.judge_id}-${judge.track_id}`,
        type: 'judge-inactive',
        severity: judge.minutes_since_last_activity && judge.minutes_since_last_activity > 30 ? 'critical' : 'warning',
        title: `Judge Inactive: ${judge.judge_name || judge.judge_email}`,
        description: `No scoring activity for ${judge.minutes_since_last_activity} minutes in ${judge.track_name}`,
        track_id: judge.track_id,
        judge_id: judge.judge_id,
        created_at: now.toISOString(),
      });
    }

    if (judge.status === 'never-scored') {
      alerts.push({
        id: `judge-never-scored-${judge.judge_id}-${judge.track_id}`,
        type: 'judge-inactive',
        severity: 'warning',
        title: `Judge Never Scored: ${judge.judge_name || judge.judge_email}`,
        description: `Assigned to ${judge.track_name} but has not submitted any scores`,
        track_id: judge.track_id,
        judge_id: judge.judge_id,
        created_at: now.toISOString(),
      });
    }
  }

  // Check for score anomalies
  for (const pattern of scorePatterns) {
    if (pattern.is_anomaly) {
      alerts.push({
        id: `score-anomaly-${pattern.judge_id}-${pattern.track_name}`,
        type: 'score-anomaly',
        severity: pattern.all_max_scores || pattern.all_min_scores ? 'critical' : 'warning',
        title: `Score Anomaly: ${pattern.judge_name || pattern.judge_email}`,
        description: pattern.anomaly_reason || 'Unusual scoring pattern detected',
        judge_id: pattern.judge_id,
        created_at: now.toISOString(),
      });
    }
  }

  // Check for stalled tracks (presenting for too long)
  for (const track of tracks) {
    if (track.status === 'in-progress' && !track.current_presenter && track.pending_count > 0) {
      alerts.push({
        id: `track-stalled-${track.id}`,
        type: 'track-stalled',
        severity: 'warning',
        title: `Track Stalled: ${track.name}`,
        description: `Track is active but no presenter is currently demoing. ${track.pending_count} demos pending.`,
        track_id: track.id,
        created_at: now.toISOString(),
      });
    }
  }

  // Sort by severity (critical first)
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });
}
