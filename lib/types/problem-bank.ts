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

// Layer B: Knowledge Graph types
export type SimilarityType = 'keyword' | 'semantic' | 'theme' | 'solution' | 'manual';
export type ClusterStatus = 'active' | 'merged' | 'archived';
export type ClusterAddedBy = 'auto' | 'manual' | 'ai';
export type EvolutionChangeType = 'title_update' | 'statement_update' | 'context_added' | 'validation_improved' | 'scope_refined' | 'ai_suggestion';

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
// LAYER B: KNOWLEDGE GRAPH INTERFACES
// ============================================

/**
 * Problem Similarity
 * AI or keyword-computed similarity between two problems
 */
export interface ProblemSimilarity {
  id: string;
  problem_id_a: string;
  problem_id_b: string;
  similarity_score: number; // 0-1
  similarity_type: SimilarityType;
  computed_at: string;
  algorithm_version: string;
}

/**
 * Problem Cluster
 * Group of related problems identified by theme or AI
 */
export interface ProblemCluster {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  primary_theme: ProblemTheme | null;

  // Metrics
  problem_count: number;
  avg_severity: number | null;
  avg_validation_score: number | null;

  // Cross-institutional
  cross_institutional: boolean;
  institutions_count: number;

  // Status
  status: ClusterStatus;
  merged_into_id: string | null;

  // AI insights
  ai_summary: string | null;
  key_patterns: string[] | null;
  suggested_actions: string[] | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Cluster Member
 * Links a problem to a cluster
 */
export interface ClusterMember {
  cluster_id: string;
  problem_id: string;
  membership_score: number; // 0-1
  is_centroid: boolean;
  added_by: ClusterAddedBy;
  added_by_user: string | null;
  added_at: string;
}

/**
 * Problem Evolution
 * Tracks how a problem statement improves over time
 */
export interface ProblemEvolution {
  id: string;
  problem_id: string;
  version: number;

  previous_title: string | null;
  new_title: string | null;
  previous_statement: string | null;
  new_statement: string | null;

  change_type: EvolutionChangeType | null;
  change_reason: string | null;
  changed_by: string | null;

  improvement_score: number | null; // -1 to 1
  changed_at: string;
}

/**
 * Cluster with problems (enriched)
 */
export interface ClusterWithProblems extends ProblemCluster {
  problems: ProblemCardData[];
  institutions: { id: string; name: string; short_name: string }[];
}

/**
 * Similar problem card
 */
export interface SimilarProblemCard {
  id: string;
  title: string;
  problem_statement: string;
  theme: ProblemTheme | null;
  similarity_score: number;
  similarity_type: SimilarityType;
  institution_short?: string;
}

/**
 * Cross-institutional pattern
 */
export interface CrossInstitutionalPattern {
  theme: ProblemTheme;
  problem_count: number;
  institutions_count: number;
  avg_severity: number | null;
  institutions: string[];
  recent_problems: string[];
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

// ============================================
// LAYER C: INNOVATION PIPELINE TYPES
// ============================================

/**
 * NIF Pipeline Stages
 */
export type NIFStage =
  | 'identified'
  | 'screened'
  | 'shortlisted'
  | 'incubating'
  | 'graduated'
  | 'rejected'
  | 'on_hold';

export const NIF_STAGES: Record<NIFStage, { label: string; color: string; description: string }> = {
  identified: {
    label: 'Identified',
    color: 'text-blue-400',
    description: 'Problem identified as potential NIF candidate',
  },
  screened: {
    label: 'Screened',
    color: 'text-cyan-400',
    description: 'Initial screening completed',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-yellow-400',
    description: 'Selected for incubation consideration',
  },
  incubating: {
    label: 'Incubating',
    color: 'text-orange-400',
    description: 'Active incubation in progress',
  },
  graduated: {
    label: 'Graduated',
    color: 'text-green-400',
    description: 'Successfully completed incubation',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    description: 'Not suitable for NIF pipeline',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-gray-400',
    description: 'Paused for review',
  },
};

/**
 * Startup Status
 */
export type StartupStatus = 'ideation' | 'mvp' | 'launched' | 'funded' | 'acquired';

/**
 * Scored By
 */
export type ScoredBy = 'ai' | 'judge' | 'mentor' | 'manual';

/**
 * Interest Level for Industry Partners
 */
export type InterestLevel = 'browsing' | 'interested' | 'committed' | 'sponsoring';

export const INTEREST_LEVELS: Record<InterestLevel, { label: string; color: string }> = {
  browsing: { label: 'Browsing', color: 'text-gray-400' },
  interested: { label: 'Interested', color: 'text-blue-400' },
  committed: { label: 'Committed', color: 'text-yellow-400' },
  sponsoring: { label: 'Sponsoring', color: 'text-green-400' },
};

/**
 * Partner Type
 */
export type PartnerType = 'company' | 'ngo' | 'government' | 'research' | 'individual';

/**
 * Research Type
 */
export type ResearchType = 'thesis' | 'paper' | 'project' | 'grant';

export const RESEARCH_TYPES: Record<ResearchType, { label: string; color: string }> = {
  thesis: { label: 'Thesis', color: 'text-purple-400' },
  paper: { label: 'Research Paper', color: 'text-blue-400' },
  project: { label: 'Project', color: 'text-green-400' },
  grant: { label: 'Grant Proposal', color: 'text-yellow-400' },
};

/**
 * Research Topic Status
 */
export type ResearchTopicStatus = 'open' | 'claimed' | 'in_progress' | 'completed' | 'published' | 'abandoned';

/**
 * Problem Score
 */
export interface ProblemScore {
  id: string;
  problem_id: string;

  // Scoring dimensions (1-10)
  severity_score: number | null;
  validation_score: number | null;
  uniqueness_score: number | null;
  feasibility_score: number | null;
  impact_potential_score: number | null;

  // Computed
  composite_score: number | null;

  scored_by: ScoredBy;
  scored_by_user: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * NIF Candidate
 */
export interface NIFCandidate {
  id: string;
  problem_id: string;

  stage: NIFStage;

  // Tracking
  identified_by: string | null;
  identified_at: string;
  screened_at: string | null;
  screened_by: string | null;
  shortlisted_at: string | null;
  shortlisted_by: string | null;
  incubation_started_at: string | null;
  graduated_at: string | null;
  rejected_at: string | null;

  decision_notes: string | null;
  rejection_reason: string | null;

  // Startup info
  startup_name: string | null;
  startup_status: StartupStatus | null;
  startup_website: string | null;
  team_members: { name: string; role: string }[];

  // Funding
  funding_stage: string | null;
  funding_amount: number | null;
  funding_currency: string;

  // Metrics
  jobs_created: number;
  revenue_generated: number;

  created_at: string;
  updated_at: string;
}

/**
 * NIF Candidate with Problem Details
 */
export interface NIFCandidateWithProblem extends NIFCandidate {
  problem: ProblemCardData;
  institution_name?: string;
  institution_short?: string;
  composite_score?: number | null;
}

/**
 * Industry Interest
 */
export interface IndustryInterest {
  id: string;
  problem_id: string;

  partner_name: string;
  partner_type: PartnerType;
  partner_website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  interest_level: InterestLevel;
  interest_notes: string | null;

  first_contact_at: string | null;
  last_contact_at: string | null;
  meetings_count: number;

  sponsorship_type: string | null;
  sponsorship_value: number | null;
  sponsorship_currency: string;

  status: 'active' | 'paused' | 'completed' | 'withdrawn';

  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Research Topic
 */
export interface ResearchTopic {
  id: string;

  problem_id: string | null;
  cluster_id: string | null;

  title: string;
  abstract: string | null;
  research_type: ResearchType;

  primary_discipline: string | null;
  secondary_disciplines: string[] | null;

  methodology_notes: string | null;
  expected_outcomes: string | null;
  potential_impact: string | null;

  suggested_by: ScoredBy;
  suggested_by_user: string | null;

  claimed_by: string | null;
  claimed_at: string | null;
  claim_institution_id: string | null;

  status: ResearchTopicStatus;

  publication_title: string | null;
  publication_venue: string | null;
  publication_url: string | null;
  publication_date: string | null;
  doi: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Research Topic with context
 */
export interface ResearchTopicWithContext extends ResearchTopic {
  problem_title?: string;
  problem_theme?: ProblemTheme | null;
  cluster_name?: string;
  claimed_by_name?: string;
  claim_institution?: string;
}

/**
 * NIF Stage History Entry
 */
export interface NIFStageHistory {
  id: string;
  candidate_id: string;
  from_stage: NIFStage | null;
  to_stage: NIFStage;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

/**
 * Pipeline Stats
 */
export interface PipelineStats {
  total_candidates: number;
  by_stage: Record<NIFStage, number>;
  total_startups: number;
  total_jobs_created: number;
  total_revenue: number;
  avg_time_to_graduation_days: number | null;
}

/**
 * Score Input
 */
export interface ScoreProblemInput {
  problem_id: string;
  severity_score?: number;
  validation_score?: number;
  uniqueness_score?: number;
  feasibility_score?: number;
  impact_potential_score?: number;
  notes?: string;
}

/**
 * Add to Pipeline Input
 */
export interface AddToPipelineInput {
  problem_id: string;
  notes?: string;
}

/**
 * Industry Interest Input
 */
export interface AddIndustryInterestInput {
  problem_id: string;
  partner_name: string;
  partner_type: PartnerType;
  partner_website?: string;
  contact_name?: string;
  contact_email?: string;
  interest_level?: InterestLevel;
  interest_notes?: string;
}

/**
 * Research Topic Input
 */
export interface CreateResearchTopicInput {
  problem_id?: string;
  cluster_id?: string;
  title: string;
  abstract?: string;
  research_type: ResearchType;
  primary_discipline?: string;
  methodology_notes?: string;
  expected_outcomes?: string;
}

// ============================================
// LAYER D: LEARNING FLYWHEEL TYPES
// ============================================

/**
 * Outcome Type
 */
export type OutcomeType = 'success' | 'partial' | 'pivot' | 'abandoned' | 'ongoing';

export const OUTCOME_TYPES: Record<OutcomeType, { label: string; color: string; description: string }> = {
  success: { label: 'Success', color: 'text-green-400', description: 'Problem fully solved, solution deployed' },
  partial: { label: 'Partial', color: 'text-yellow-400', description: 'Partially solved, some impact achieved' },
  pivot: { label: 'Pivot', color: 'text-blue-400', description: 'Problem understanding changed, pivoted' },
  abandoned: { label: 'Abandoned', color: 'text-red-400', description: 'Attempt stopped without resolution' },
  ongoing: { label: 'Ongoing', color: 'text-purple-400', description: 'Still being worked on' },
};

/**
 * Problem Outcome
 */
export interface ProblemOutcome {
  id: string;
  problem_id: string;
  attempt_id: string | null;

  outcome_type: OutcomeType;
  outcome_description: string | null;

  // Success metrics
  time_to_solution_days: number | null;
  iterations_count: number;
  user_adoption_rate: number | null;
  satisfaction_score: number | null;

  // Impact metrics
  users_impacted: number;
  time_saved_hours: number;
  cost_saved: number;
  revenue_generated: number;

  // Learnings
  what_worked: string | null;
  what_didnt_work: string | null;
  key_insights: string[];
  recommendations: string[];

  recorded_by: string | null;
  recorded_at: string;
  updated_at: string;
}

/**
 * Outcome with Problem Details
 */
export interface ProblemOutcomeWithDetails extends ProblemOutcome {
  problem?: {
    title: string;
    theme: ProblemTheme | null;
  };
  attempt?: {
    team_name: string | null;
    app_url: string | null;
  };
  recorder?: {
    name: string | null;
    email: string;
  };
}

/**
 * Refinement Type
 */
export type RefinementType =
  | 'clarity'
  | 'scope'
  | 'user_focus'
  | 'validation'
  | 'feasibility'
  | 'impact'
  | 'general';

export const REFINEMENT_TYPES: Record<RefinementType, { label: string; description: string; color: string }> = {
  clarity: { label: 'Clarity', description: 'Make problem statement clearer', color: 'text-blue-400' },
  scope: { label: 'Scope', description: 'Adjust problem scope', color: 'text-purple-400' },
  user_focus: { label: 'User Focus', description: 'Better define affected users', color: 'text-green-400' },
  validation: { label: 'Validation', description: 'Add validation suggestions', color: 'text-amber-400' },
  feasibility: { label: 'Feasibility', description: 'Suggest more feasible framing', color: 'text-cyan-400' },
  impact: { label: 'Impact', description: 'Highlight impact potential', color: 'text-orange-400' },
  general: { label: 'General', description: 'General improvement', color: 'text-stone-400' },
};

/**
 * Refinement Based On
 */
export type RefinementBasedOn =
  | 'similar_successes'
  | 'user_feedback'
  | 'outcome_patterns'
  | 'cluster_analysis'
  | 'industry_input';

export const REFINEMENT_BASED_ON: Record<RefinementBasedOn, { label: string; description: string }> = {
  similar_successes: { label: 'Similar Successes', description: 'Based on patterns from successful problems' },
  user_feedback: { label: 'User Feedback', description: 'Based on actual user feedback' },
  outcome_patterns: { label: 'Outcome Patterns', description: 'Based on observed outcome patterns' },
  cluster_analysis: { label: 'Cluster Analysis', description: 'Based on problem cluster insights' },
  industry_input: { label: 'Industry Input', description: 'Based on industry partner feedback' },
};

/**
 * Refinement Status
 */
export type RefinementStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

export const REFINEMENT_STATUSES: Record<RefinementStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-stone-400' },
  accepted: { label: 'Accepted', color: 'text-green-400' },
  rejected: { label: 'Rejected', color: 'text-red-400' },
  modified: { label: 'Modified', color: 'text-blue-400' },
};

/**
 * AI Refinement
 */
export interface AIRefinement {
  id: string;
  problem_id: string;

  original_statement: string;
  suggested_statement: string;
  refinement_type: RefinementType;
  refinement_reason: string | null;

  confidence_score: number | null;
  based_on: RefinementBasedOn | null;
  source_problem_ids: string[];

  status: RefinementStatus;
  user_response_notes: string | null;
  responded_by: string | null;
  responded_at: string | null;

  created_at: string;
}

/**
 * AI Refinement with Problem
 */
export interface AIRefinementWithProblem extends AIRefinement {
  problem?: {
    title: string;
    theme: ProblemTheme | null;
  };
}

/**
 * Case Study Status
 */
export type CaseStudyStatus = 'draft' | 'under_review' | 'approved' | 'published' | 'archived';

export const CASE_STUDY_STATUSES: Record<CaseStudyStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-stone-400' },
  under_review: { label: 'Under Review', color: 'text-yellow-400' },
  approved: { label: 'Approved', color: 'text-blue-400' },
  published: { label: 'Published', color: 'text-green-400' },
  archived: { label: 'Archived', color: 'text-red-400' },
};

/**
 * Difficulty Level
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'text-green-400' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-400' },
  advanced: { label: 'Advanced', color: 'text-red-400' },
};

/**
 * Case Study
 */
export interface CaseStudy {
  id: string;

  problem_id: string;
  attempt_id: string | null;
  outcome_id: string | null;

  title: string;
  slug: string;
  summary: string | null;
  full_content: string | null;

  // Structured sections
  section_problem: string | null;
  section_context: string | null;
  section_approach: string | null;
  section_solution: string | null;
  section_implementation: string | null;
  section_impact: string | null;
  section_lessons: string | null;
  section_recommendations: string | null;

  // Categorization
  theme: ProblemTheme | null;
  tags: string[];
  difficulty_level: DifficultyLevel | null;

  // Teaching value
  learning_objectives: string[];
  key_takeaways: string[];
  discussion_questions: string[];

  // Media
  featured_image_url: string | null;
  media_urls: string[];

  // Publishing
  status: CaseStudyStatus;
  published_at: string | null;

  // Authorship
  generated_by: 'ai' | 'manual' | 'hybrid' | null;
  reviewed_by: string | null;
  approved_by: string | null;

  // Metrics
  view_count: number;
  like_count: number;
  share_count: number;

  created_at: string;
  updated_at: string;
}

/**
 * Published Case Study
 */
export interface PublishedCaseStudy {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  theme: ProblemTheme | null;
  tags: string[];
  difficulty_level: DifficultyLevel | null;
  learning_objectives: string[];
  key_takeaways: string[];
  featured_image_url: string | null;
  published_at: string;
  view_count: number;
  like_count: number;
  problem_title?: string;
  institution_name?: string;
  institution_short?: string;
}

/**
 * Learning Pattern Type
 */
export type LearningPatternType =
  | 'success_factor'
  | 'failure_warning'
  | 'optimal_approach'
  | 'common_mistake'
  | 'time_estimator'
  | 'resource_predictor';

export const LEARNING_PATTERN_TYPES: Record<LearningPatternType, { label: string; color: string; description: string }> = {
  success_factor: { label: 'Success Factor', color: 'text-green-400', description: 'What leads to success' },
  failure_warning: { label: 'Failure Warning', color: 'text-red-400', description: 'What leads to failure' },
  optimal_approach: { label: 'Optimal Approach', color: 'text-blue-400', description: 'Best practices' },
  common_mistake: { label: 'Common Mistake', color: 'text-orange-400', description: 'What to avoid' },
  time_estimator: { label: 'Time Estimator', color: 'text-purple-400', description: 'How long things take' },
  resource_predictor: { label: 'Resource Predictor', color: 'text-yellow-400', description: 'What resources are needed' },
};

/**
 * Learning Pattern
 */
export interface LearningPattern {
  id: string;
  pattern_type: LearningPatternType;
  title: string;
  description: string;
  conditions: Record<string, unknown> | null;

  supporting_outcomes: number;
  confidence_score: number | null;
  sample_problem_ids: string[];

  applicable_themes: ProblemTheme[];
  applicable_stages: NIFStage[];

  action_items: string[];

  discovered_at: string;
  last_validated: string;
  is_active: boolean;
}

/**
 * Flywheel Metrics
 */
export interface FlywheelMetrics {
  id: string;

  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  // Problem metrics
  problems_submitted: number;
  problems_validated: number;
  problems_in_pipeline: number;

  // Outcome metrics
  outcomes_success: number;
  outcomes_partial: number;
  outcomes_abandoned: number;
  avg_time_to_solution: number | null;

  // AI metrics
  refinements_suggested: number;
  refinements_accepted: number;
  refinement_acceptance_rate: number | null;

  // Case study metrics
  case_studies_generated: number;
  case_studies_published: number;
  case_study_views: number;

  // Impact metrics
  total_users_impacted: number;
  total_time_saved_hours: number;
  total_revenue_generated: number;

  // Learning metrics
  patterns_discovered: number;
  patterns_validated: number;

  computed_at: string;
}

/**
 * Flywheel Summary
 */
export interface FlywheelSummary {
  // Problems & Outcomes
  total_problems: number;
  problems_with_outcomes: number;
  outcome_rate: number;
  success_rate: number;
  average_solution_time_days: number | null;

  // Impact Metrics
  total_users_impacted: number;
  total_time_saved_hours: number;
  total_cost_saved: number;
  total_revenue_generated: number;

  // Case Studies
  total_case_studies: number;
  published_case_studies: number;
  total_case_study_views: number;

  // AI Refinements
  total_refinements: number;
  refinements_accepted: number;
  refinement_acceptance_rate: number;

  // Learning Patterns
  total_patterns: number;
  active_patterns: number;
}

/**
 * Outcome Input
 */
export interface RecordOutcomeInput {
  problem_id: string;
  attempt_id?: string;
  outcome_type: OutcomeType;
  outcome_description?: string;
  time_to_solution_days?: number;
  iterations_count?: number;
  user_adoption_rate?: number;
  satisfaction_score?: number;
  users_impacted?: number;
  time_saved_hours?: number;
  cost_saved?: number;
  revenue_generated?: number;
  what_worked?: string;
  what_didnt_work?: string;
  key_insights?: string[];
  recommendations?: string[];
}

/**
 * Case Study Input
 */
export interface CreateCaseStudyInput {
  problem_id: string;
  attempt_id?: string;
  outcome_id?: string;
  title: string;
  summary?: string;
  full_content?: string;
  // Structured sections
  problem_section?: string;
  approach_section?: string;
  solution_section?: string;
  impact_section?: string;
  lessons_section?: string;
  // Metadata
  target_audience?: string[];
  difficulty_level?: DifficultyLevel;
  estimated_read_time_minutes?: number;
  related_problems?: string[];
  external_references?: string[];
  media_urls?: string[];
  theme?: ProblemTheme;
  tags?: string[];
  learning_objectives?: string[];
  key_takeaways?: string[];
}

/**
 * AI Refinement Response Input
 */
export interface RespondToRefinementInput {
  action: 'accept' | 'reject' | 'modify';
  modified_statement?: string;
  notes?: string;
}
