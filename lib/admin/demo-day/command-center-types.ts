// Types for Demo Day Command Center Real-Time Monitoring

import type { TrackOverview } from './types';

// Judge Activity Monitoring
export interface JudgeActivity {
  judge_id: string;
  judge_name: string | null;
  judge_email: string;
  track_id: string;
  track_name: string;
  is_lead: boolean;
  last_score_at: string | null;
  total_scores_submitted: number;
  minutes_since_last_activity: number | null;
  is_inactive: boolean; // true if >20 minutes since last activity
  status: 'active' | 'idle' | 'inactive' | 'never-scored';
}

// Score Anomaly Detection
export interface JudgeScorePattern {
  judge_id: string;
  judge_name: string | null;
  judge_email: string;
  track_name: string;
  scores_given: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  std_dev: number;
  all_same_score: boolean;
  all_max_scores: boolean; // all 10s
  all_min_scores: boolean; // all 1s
  is_anomaly: boolean;
  anomaly_reason: string | null;
}

export interface TrackScoreDistribution {
  track_id: string;
  track_name: string;
  total_scores: number;
  avg_score: number;
  std_dev: number;
  score_buckets: {
    range: string; // e.g., "1-2", "3-4", etc.
    count: number;
    percentage: number;
  }[];
  outliers: {
    submission_id: string;
    app_name: string;
    avg_score: number;
    deviation_from_mean: number; // in standard deviations
  }[];
}

// Enhanced Track Status for Command Center
export interface CommandCenterTrack extends TrackOverview {
  estimated_end_time: string | null;
  avg_demo_duration_minutes: number | null;
  is_behind_schedule: boolean;
  minutes_behind: number;
  demos_per_hour: number | null;
  presenter_started_at: string | null;
  presenter_elapsed_minutes: number | null;
}

// Aggregated Command Center State
export interface CommandCenterState {
  event_id: string;
  fetched_at: string;

  // Track Overview
  tracks: CommandCenterTrack[];
  total_submissions: number;
  total_completed: number;
  total_pending: number;
  total_presenting: number;
  overall_progress_percent: number;

  // Judge Activity
  judge_activities: JudgeActivity[];
  total_judges: number;
  active_judges: number;
  inactive_judges: number;
  judges_needing_attention: JudgeActivity[];

  // Score Anomalies
  score_patterns: JudgeScorePattern[];
  track_distributions: TrackScoreDistribution[];
  anomalies_detected: number;

  // Alerts
  alerts: CommandCenterAlert[];
}

export interface CommandCenterAlert {
  id: string;
  type: 'judge-inactive' | 'score-anomaly' | 'track-delayed' | 'track-stalled' | 'scoring-incomplete';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  track_id?: string;
  judge_id?: string;
  submission_id?: string;
  action_url?: string;
  created_at: string;
}

// API Response
export interface CommandCenterResponse {
  data: CommandCenterState;
  success: boolean;
  error?: string;
}
