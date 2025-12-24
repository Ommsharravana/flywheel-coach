// Problem Intelligence System - TypeScript Types

// ============================================
// ENUMS / UNION TYPES
// ============================================

// Aligned with Appathon 2.0 Bioconvergence Themes
export type ProblemTheme =
  | 'healthcare'   // Healthcare + AI
  | 'education'    // Education + AI
  | 'agriculture'  // Agriculture + AI
  | 'environment'  // Environment + AI
  | 'community'    // Community + AI
  | 'myjkkn'       // MyJKKN Data Integration Track
  | 'other';

export type ProblemStatus = 'open' | 'claimed' | 'in_progress' | 'solved' | 'archived';

export type ValidationStatus =
  | 'unvalidated'
  | 'user_tested'
  | 'desperate_user_confirmed'
  | 'market_validated';

export type ProblemSourceType = 'cycle' | 'manual' | 'import' | 'appathon';

export type ProblemFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely';

export type AttemptOutcome = 'building' | 'deployed' | 'abandoned' | 'success' | 'partial';

export type TagType = 'theme' | 'technology' | 'domain' | 'custom' | 'auto';

export type EvidenceType = 'interview' | 'survey' | 'observation' | 'testimonial' | 'metric' | 'quote';

// ============================================
// CORE INTERFACES
// ============================================

/**
 * Problem Bank Entry
 * Central repository of validated problems from across institutions
 */
export interface ProblemBankEntry {
  id: string;

  // Source tracking
  original_cycle_id: string | null;
  source_type: ProblemSourceType;
  source_year: number;
  source_event: string | null;

  // Core problem data
  title: string;
  problem_statement: string;
  theme: ProblemTheme | null;
  sub_theme: string | null;

  // Context
  who_affected: string | null;
  when_occurs: string | null;
  where_occurs: string | null;
  frequency: ProblemFrequency | null;
  severity_rating: number | null; // 1-10
  current_workaround: string | null;

  // Validation
  validation_status: ValidationStatus;
  users_interviewed: number;
  desperate_user_count: number;
  desperate_user_score: number | null; // 0-5

  // Institutional
  institution_id: string | null;
  department: string | null;
  submitted_by: string | null;

  // Lifecycle
  status: ProblemStatus;
  is_open_for_attempts: boolean;

  // Solution reference
  best_solution_cycle_id: string | null;
  best_solution_url: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Metadata
  metadata: Record<string, unknown>;
}

/**
 * Problem Attempt
 * Tracks teams/individuals attempting to solve a problem
 */
export interface ProblemAttempt {
  id: string;
  problem_id: string;
  cycle_id: string | null;
  user_id: string | null;

  team_name: string | null;

  outcome: AttemptOutcome | null;
  outcome_notes: string | null;

  users_reached: number;
  impact_score: number | null; // 0-100
  app_url: string | null;

  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Problem Tag
 * Flexible categorization for problems
 */
export interface ProblemTag {
  id: string;
  problem_id: string;
  tag: string;
  tag_type: TagType;
  created_by: string | null;
  created_at: string;
}

/**
 * Problem Evidence
 * Validation data: interviews, testimonials, metrics
 */
export interface ProblemEvidence {
  id: string;
  problem_id: string;

  evidence_type: EvidenceType;
  content: string;
  source_name: string | null;
  source_role: string | null;

  pain_level: number | null; // 1-10
  collected_at: string | null;
  collected_by: string | null;

  created_at: string;
}

// ============================================
// ENRICHED TYPES (with relations)
// ============================================

/**
 * Problem with all related data
 */
export interface ProblemWithDetails extends ProblemBankEntry {
  tags: ProblemTag[];
  evidence: ProblemEvidence[];
  attempts: ProblemAttempt[];
  attempt_count: number;
  successful_attempts: number;

  // Submitter info (joined)
  submitter?: {
    id: string;
    name: string | null;
    email: string;
  };

  // Institution info (joined)
  institution?: {
    id: string;
    name: string;
    short_name: string;
  };
}

/**
 * Problem card display (minimal data for lists)
 */
export interface ProblemCardData {
  id: string;
  title: string;
  problem_statement: string;
  theme: ProblemTheme | null;
  status: ProblemStatus;
  validation_status: ValidationStatus;
  severity_rating: number | null;
  desperate_user_score: number | null;
  created_at: string;
  attempt_count: number;

  institution_name?: string;
  institution_short?: string;
  submitter_name?: string;
}

// ============================================
// FORM INPUT TYPES
// ============================================

/**
 * Create new problem form input
 */
export interface CreateProblemInput {
  title: string;
  problem_statement: string;
  theme?: ProblemTheme;
  sub_theme?: string;

  who_affected?: string;
  when_occurs?: string;
  where_occurs?: string;
  frequency?: ProblemFrequency;
  severity_rating?: number;
  current_workaround?: string;

  source_type?: ProblemSourceType;
  source_event?: string;

  // Will be auto-filled from auth
  // institution_id, department, submitted_by
}

/**
 * Update problem form input
 */
export interface UpdateProblemInput {
  title?: string;
  problem_statement?: string;
  theme?: ProblemTheme;
  sub_theme?: string;

  who_affected?: string;
  when_occurs?: string;
  where_occurs?: string;
  frequency?: ProblemFrequency;
  severity_rating?: number;
  current_workaround?: string;

  status?: ProblemStatus;
  is_open_for_attempts?: boolean;

  validation_status?: ValidationStatus;
}

/**
 * Add evidence form input
 */
export interface AddEvidenceInput {
  problem_id: string;
  evidence_type: EvidenceType;
  content: string;
  source_name?: string;
  source_role?: string;
  pain_level?: number;
  collected_at?: string;
}

/**
 * Start attempt form input
 */
export interface StartAttemptInput {
  problem_id: string;
  cycle_id?: string;
  team_name?: string;
}

/**
 * Update attempt form input
 */
export interface UpdateAttemptInput {
  outcome?: AttemptOutcome;
  outcome_notes?: string;
  users_reached?: number;
  impact_score?: number;
  app_url?: string;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

/**
 * Problem bank filters
 */
export interface ProblemFilters {
  theme?: ProblemTheme;
  themes?: ProblemTheme[]; // Multi-select
  status?: ProblemStatus;
  statuses?: ProblemStatus[]; // Multi-select
  validation_status?: ValidationStatus;
  institution_id?: string;
  source_type?: ProblemSourceType;
  source_year?: number;
  min_severity?: number;
  max_severity?: number;
  has_attempts?: boolean;
  is_open?: boolean;
  submitted_by?: string;
  search?: string; // Full-text search
}

/**
 * Problem sort options
 */
export type ProblemSortField =
  | 'created_at'
  | 'updated_at'
  | 'severity_rating'
  | 'desperate_user_score'
  | 'title'
  | 'attempt_count';

export type SortDirection = 'asc' | 'desc';

export interface ProblemSort {
  field: ProblemSortField;
  direction: SortDirection;
}

/**
 * Paginated response
 */
export interface PaginatedProblems {
  data: ProblemCardData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Problem bank statistics
 */
export interface ProblemBankStats {
  total_problems: number;
  open_problems: number;
  solved_problems: number;
  validated_problems: number;
  institutions_represented: number;
  themes_covered: number;
  avg_severity: number | null;
  problems_last_30_days: number;
}

/**
 * Problems by theme breakdown
 */
export interface ProblemsByTheme {
  theme: ProblemTheme;
  problem_count: number;
  open_count: number;
  solved_count: number;
  avg_severity: number | null;
  institutions: number;
}

/**
 * Problems by institution breakdown
 */
export interface ProblemsByInstitution {
  institution_id: string;
  institution_name: string;
  short_name: string;
  problem_count: number;
  open_count: number;
  validated_count: number;
  themes_covered: number;
}

/**
 * Hot problems (emerging patterns)
 */
export interface HotProblem {
  theme: ProblemTheme;
  sub_theme: string | null;
  problem_count: number;
  institutions_identifying: number;
  avg_severity: number;
  problem_titles: string[];
}

/**
 * Attempt statistics per problem
 */
export interface ProblemAttemptStats {
  problem_id: string;
  title: string;
  theme: ProblemTheme | null;
  total_attempts: number;
  successful_attempts: number;
  abandoned_attempts: number;
  avg_impact_score: number | null;
  max_users_reached: number;
}

// ============================================
// UI HELPER TYPES
// ============================================

/**
 * Theme display info
 */
export const PROBLEM_THEMES: Record<ProblemTheme, { label: string; emoji: string; color: string }> = {
  healthcare: { label: 'Healthcare + AI', emoji: '🏥', color: 'text-red-500' },
  education: { label: 'Education + AI', emoji: '📚', color: 'text-blue-500' },
  agriculture: { label: 'Agriculture + AI', emoji: '🌾', color: 'text-green-500' },
  environment: { label: 'Environment + AI', emoji: '🌍', color: 'text-emerald-500' },
  community: { label: 'Community + AI', emoji: '👥', color: 'text-purple-500' },
  myjkkn: { label: 'MyJKKN Apps', emoji: '📱', color: 'text-cyan-500' },
  other: { label: 'Other', emoji: '💡', color: 'text-yellow-500' },
};

/**
 * Status display info
 */
export const PROBLEM_STATUSES: Record<ProblemStatus, { label: string; color: string }> = {
  open: { label: 'Open for Attempts', color: 'bg-green-100 text-green-800' },
  claimed: { label: 'Being Worked On', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  solved: { label: 'Solved', color: 'bg-purple-100 text-purple-800' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800' },
};

/**
 * Validation status display info
 */
export const VALIDATION_STATUSES: Record<ValidationStatus, { label: string; description: string; color: string }> = {
  unvalidated: {
    label: 'Unvalidated',
    description: 'Problem identified but not yet validated with users',
    color: 'bg-gray-100 text-gray-600',
  },
  user_tested: {
    label: 'User Tested',
    description: 'Problem discussed with some users',
    color: 'bg-blue-100 text-blue-700',
  },
  desperate_user_confirmed: {
    label: 'Desperate Users Found',
    description: 'Users confirmed they urgently need a solution',
    color: 'bg-green-100 text-green-700',
  },
  market_validated: {
    label: 'Market Validated',
    description: 'Solution deployed and adopted by users',
    color: 'bg-purple-100 text-purple-700',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get severity label from rating
 */
export function getSeverityLabel(rating: number | null): string {
  if (rating === null) return 'Unknown';
  if (rating <= 3) return 'Low';
  if (rating <= 6) return 'Medium';
  if (rating <= 8) return 'High';
  return 'Critical';
}

/**
 * Get severity color class from rating
 */
export function getSeverityColor(rating: number | null): string {
  if (rating === null) return 'text-gray-400';
  if (rating <= 3) return 'text-green-500';
  if (rating <= 6) return 'text-yellow-500';
  if (rating <= 8) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Format desperate user score as display text
 */
export function formatDesperateUserScore(score: number | null): string {
  if (score === null) return 'Not assessed';
  return `${score}/5 criteria met`;
}

/**
 * Check if problem is worth pursuing based on validation
 */
export function isHighPotentialProblem(problem: ProblemBankEntry): boolean {
  return (
    problem.validation_status === 'desperate_user_confirmed' ||
    problem.validation_status === 'market_validated' ||
    (problem.desperate_user_score !== null && problem.desperate_user_score >= 3) ||
    (problem.severity_rating !== null && problem.severity_rating >= 7)
  );
}
