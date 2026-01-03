// Types for Demo Day Command Center

export interface JudgingTrack {
  id: string;
  event_id: string;
  name: string;
  theme: string;
  description: string | null;
  room_location: string | null;
  demo_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackJudge {
  id: string;
  track_id: string;
  user_id: string;
  is_lead: boolean;
  assigned_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface SubmissionTrackAssignment {
  id: string;
  submission_id: string;
  track_id: string;
  demo_slot: number | null;
  demo_time: string | null;
  status: 'pending' | 'presenting' | 'completed' | 'skipped';
  created_at: string;
}

export interface JudgeScore {
  id: string;
  submission_id: string;
  judge_id: string;
  track_id: string | null;
  problem_impact: number | null;
  solution_innovation: number | null;
  working_prototype: number | null;
  user_validation: number | null;
  presentation_quality: number | null;
  bioconvergence_alignment: number | null;
  bonus_cross_disciplinary: boolean;
  bonus_cross_institutional: boolean;
  bonus_first_year: boolean;
  bonus_user_testimonials: boolean;
  weighted_score: number | null;
  bonus_percentage: number | null;
  total_score: number | null;
  notes: string | null;
  strengths: string | null;
  improvements: string | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceVote {
  id: string;
  submission_id: string;
  voter_id: string | null;
  voter_identifier: string | null;
  rating: number;
  reaction: 'love' | 'innovative' | 'useful' | 'polished' | 'impactful' | null;
  voted_at: string;
  device_type: string | null;
}

export interface AppathonSubmission {
  id: string;
  submission_number: string;
  app_name: string;
  category: string;
  status: string;
  lovable_url: string | null;
  live_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Aggregated types for Command Center

export interface TrackOverview {
  id: string;
  name: string;
  theme: string;
  room_location: string | null;
  is_active: boolean;
  total_submissions: number;
  pending_count: number;
  presenting_count: number;
  completed_count: number;
  skipped_count: number;
  current_presenter: {
    submission_id: string;
    app_name: string;
    submission_number: string;
    demo_slot: number;
  } | null;
  judges: TrackJudge[];
  status: 'not-started' | 'in-progress' | 'delayed' | 'completed' | 'paused';
}

export interface TrackSubmission {
  id: string;
  submission_id: string;
  submission_number: string;
  app_name: string;
  category: string;
  demo_slot: number | null;
  status: 'pending' | 'presenting' | 'completed' | 'skipped';
  judge_count: number;
  judge_target: number;
  judges_completed: number;
  audience_vote_count: number;
  audience_avg_rating: number | null;
  final_score: number | null;
  user?: {
    name: string | null;
    email: string;
    institution?: string;
  };
}

export interface LeaderboardEntry {
  submission_id: string;
  submission_number: string;
  app_name: string;
  category: string;
  track_id: string;
  track_name: string;
  avg_judge_score: number;
  audience_score: number;
  avg_bonus: number;
  final_score: number;
  judge_count: number;
  vote_count: number;
  rank: number;
}

export interface DemoDayState {
  event_id: string;
  is_live: boolean;
  results_revealed: boolean;
  is_paused: boolean;
  tracks: TrackOverview[];
  total_submissions: number;
  total_completed: number;
  total_judges: number;
  total_votes: number;
}

// Admin action types
export type TrackAction =
  | 'advance-presenter'
  | 'skip-team'
  | 'move-to-end'
  | 'pause-track'
  | 'resume-track'
  | 'close-track'
  | 'reopen-track';

export interface AdminActionPayload {
  track_id: string;
  submission_id?: string;
  reason?: string;
}
