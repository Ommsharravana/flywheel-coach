export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUM TYPES (matching database enums)
// ============================================

export type UserRole = 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin'
export type UserCategory = 'learner' | 'senior_learner'
export type CycleStatus = 'active' | 'completed' | 'abandoned'
export type MessageRole = 'user' | 'assistant' | 'system'
export type ProblemFrequency = 'daily' | 'weekly' | 'monthly' | 'occasional' | 'rarely'
export type ValueQuadrant = 'quick-win' | 'strategic' | 'selective' | 'skip'
export type ValueDecision = 'proceed' | 'iterate' | 'pivot' | 'stop'
export type WorkflowType = 'AUDIT' | 'GENERATION' | 'TRANSFORMATION' | 'CLASSIFICATION' | 'EXTRACTION' | 'SYNTHESIS' | 'PREDICTION' | 'RECOMMENDATION' | 'MONITORING' | 'ORCHESTRATION'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type InstitutionType = 'college' | 'school' | 'external'
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'
export type ProblemTheme = 'healthcare' | 'education' | 'agriculture' | 'environment' | 'community' | 'myjkkn' | 'other'
export type ProblemStatus = 'open' | 'claimed' | 'in_progress' | 'solved' | 'archived'
export type ValidationStatus = 'unvalidated' | 'user_tested' | 'desperate_user_confirmed' | 'market_validated'
export type ProblemSourceType = 'cycle' | 'manual' | 'import' | 'appathon'
export type AttemptOutcome = 'building' | 'deployed' | 'abandoned' | 'success' | 'partial'
export type TagType = 'theme' | 'technology' | 'domain' | 'custom' | 'auto'
export type EvidenceType = 'interview' | 'survey' | 'observation' | 'testimonial' | 'metric' | 'quote'
export type SimilarityType = 'keyword' | 'semantic' | 'theme' | 'solution' | 'manual'
export type ClusterStatus = 'active' | 'merged' | 'archived'
export type ClusterAddedBy = 'auto' | 'manual' | 'ai'
export type EvolutionChangeType = 'title_update' | 'statement_update' | 'context_added' | 'validation_improved' | 'scope_refined' | 'ai_suggestion'
export type NIFStage = 'identified' | 'screened' | 'shortlisted' | 'incubating' | 'graduated' | 'rejected' | 'on_hold'
export type StartupStatus = 'ideation' | 'mvp' | 'launched' | 'funded' | 'acquired'
export type ScoredBy = 'ai' | 'judge' | 'mentor' | 'manual'
export type InterestLevel = 'browsing' | 'interested' | 'committed' | 'sponsoring'
export type PartnerType = 'company' | 'ngo' | 'government' | 'research' | 'individual'
export type ResearchType = 'thesis' | 'paper' | 'project' | 'grant'
export type ResearchTopicStatus = 'open' | 'claimed' | 'in_progress' | 'completed' | 'published' | 'abandoned'
export type OutcomeType = 'success' | 'partial' | 'pivot' | 'abandoned' | 'ongoing'
export type RefinementType = 'clarity' | 'scope' | 'user_focus' | 'validation' | 'feasibility' | 'impact' | 'general'
export type RefinementBasedOn = 'similar_successes' | 'user_feedback' | 'outcome_patterns' | 'cluster_analysis' | 'industry_input'
export type RefinementStatus = 'pending' | 'accepted' | 'rejected' | 'modified'
export type CaseStudyStatus = 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type LearningPatternType = 'success_factor' | 'failure_warning' | 'optimal_approach' | 'common_mistake' | 'time_estimator' | 'resource_predictor'
export type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested'

export type Database = {
  public: {
    Tables: {
      // ============================================
      // CORE USER & AUTH TABLES
      // ============================================
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          institution: string
          institution_id: string | null
          department: string | null
          year_of_study: number | null
          role: UserRole
          user_category: UserCategory
          onboarding_completed: boolean
          language: 'en' | 'ta'
          active_event_id: string | null
          gemini_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          institution?: string
          institution_id?: string | null
          department?: string | null
          year_of_study?: number | null
          role?: UserRole
          user_category?: UserCategory
          onboarding_completed?: boolean
          language?: 'en' | 'ta'
          active_event_id?: string | null
          gemini_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          institution?: string
          institution_id?: string | null
          department?: string | null
          year_of_study?: number | null
          role?: UserRole
          user_category?: UserCategory
          onboarding_completed?: boolean
          language?: 'en' | 'ta'
          active_event_id?: string | null
          gemini_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // INSTITUTION TABLES
      // ============================================
      institutions: {
        Row: {
          id: string
          slug: string
          name: string
          short_name: string
          type: InstitutionType
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          short_name: string
          type?: InstitutionType
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          short_name?: string
          type?: InstitutionType
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      institution_admins: {
        Row: {
          id: string
          user_id: string
          institution_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string
          created_at?: string
        }
      }
      institution_change_requests: {
        Row: {
          id: string
          user_id: string
          from_institution_id: string | null
          to_institution_id: string
          status: ChangeRequestStatus
          reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_institution_id?: string | null
          to_institution_id: string
          status?: ChangeRequestStatus
          reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_institution_id?: string | null
          to_institution_id?: string
          status?: ChangeRequestStatus
          reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }

      // ============================================
      // EVENT TABLES
      // ============================================
      events: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          is_active: boolean
          banner_color: string | null
          config: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          is_active?: boolean
          banner_color?: string | null
          config?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          banner_color?: string | null
          config?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_admins: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      event_problems: {
        Row: {
          id: string
          event_id: string
          problem_id: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          problem_id: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          problem_id?: string
          added_by?: string | null
          created_at?: string
        }
      }

      // ============================================
      // CYCLE TABLES (Solution Studio workflow)
      // ============================================
      cycles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          status: CycleStatus
          current_step: number
          started_at: string
          completed_at: string | null
          impact_score: number | null
          event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          status?: CycleStatus
          current_step?: number
          started_at?: string
          completed_at?: string | null
          impact_score?: number | null
          event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          status?: CycleStatus
          current_step?: number
          started_at?: string
          completed_at?: string | null
          impact_score?: number | null
          event_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          cycle_id: string
          q_takes_too_long: string | null
          q_repetitive: string | null
          q_lookup_repeatedly: string | null
          q_complaints: string | null
          q_would_pay: string | null
          selected_question: string | null
          refined_statement: string | null
          pain_level: number | null
          frequency: ProblemFrequency | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          q_takes_too_long?: string | null
          q_repetitive?: string | null
          q_lookup_repeatedly?: string | null
          q_complaints?: string | null
          q_would_pay?: string | null
          selected_question?: string | null
          refined_statement?: string | null
          pain_level?: number | null
          frequency?: ProblemFrequency | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          q_takes_too_long?: string | null
          q_repetitive?: string | null
          q_lookup_repeatedly?: string | null
          q_complaints?: string | null
          q_would_pay?: string | null
          selected_question?: string | null
          refined_statement?: string | null
          pain_level?: number | null
          frequency?: ProblemFrequency | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contexts: {
        Row: {
          id: string
          cycle_id: string
          primary_users: string | null
          secondary_users: string | null
          estimated_count: number | null
          frequency: string | null
          specific_trigger: string | null
          duration: string | null
          pain_level: number | null
          impact_if_unsolved: string | null
          current_workaround: string | null
          time_on_workaround: string | null
          workaround_satisfaction: number | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          primary_users?: string | null
          secondary_users?: string | null
          estimated_count?: number | null
          frequency?: string | null
          specific_trigger?: string | null
          duration?: string | null
          pain_level?: number | null
          impact_if_unsolved?: string | null
          current_workaround?: string | null
          time_on_workaround?: string | null
          workaround_satisfaction?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          primary_users?: string | null
          secondary_users?: string | null
          estimated_count?: number | null
          frequency?: string | null
          specific_trigger?: string | null
          duration?: string | null
          pain_level?: number | null
          impact_if_unsolved?: string | null
          current_workaround?: string | null
          time_on_workaround?: string | null
          workaround_satisfaction?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          context_id: string
          interviewee_name: string | null
          interviewee_role: string | null
          key_quote: string | null
          pain_level: number | null
          referrals: string[] | null
          conducted_at: string
        }
        Insert: {
          id?: string
          context_id: string
          interviewee_name?: string | null
          interviewee_role?: string | null
          key_quote?: string | null
          pain_level?: number | null
          referrals?: string[] | null
          conducted_at?: string
        }
        Update: {
          id?: string
          context_id?: string
          interviewee_name?: string | null
          interviewee_role?: string | null
          key_quote?: string | null
          pain_level?: number | null
          referrals?: string[] | null
          conducted_at?: string
        }
      }
      value_assessments: {
        Row: {
          id: string
          cycle_id: string
          multiple_have_it: boolean | null
          multiple_have_it_evidence: string | null
          complained_before: boolean | null
          complained_before_evidence: string | null
          doing_something: boolean | null
          doing_something_evidence: string | null
          light_up_at_solution: boolean | null
          light_up_evidence: string | null
          ask_when_can_use: boolean | null
          ask_when_evidence: string | null
          desperate_user_score: number | null
          quadrant: ValueQuadrant | null
          decision: ValueDecision | null
          reasoning: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          multiple_have_it?: boolean | null
          multiple_have_it_evidence?: string | null
          complained_before?: boolean | null
          complained_before_evidence?: string | null
          doing_something?: boolean | null
          doing_something_evidence?: string | null
          light_up_at_solution?: boolean | null
          light_up_evidence?: string | null
          ask_when_can_use?: boolean | null
          ask_when_evidence?: string | null
          desperate_user_score?: number | null
          quadrant?: ValueQuadrant | null
          decision?: ValueDecision | null
          reasoning?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          multiple_have_it?: boolean | null
          multiple_have_it_evidence?: string | null
          complained_before?: boolean | null
          complained_before_evidence?: string | null
          doing_something?: boolean | null
          doing_something_evidence?: string | null
          light_up_at_solution?: boolean | null
          light_up_evidence?: string | null
          ask_when_can_use?: boolean | null
          ask_when_evidence?: string | null
          desperate_user_score?: number | null
          quadrant?: ValueQuadrant | null
          decision?: ValueDecision | null
          reasoning?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workflow_classifications: {
        Row: {
          id: string
          cycle_id: string
          workflow_type: WorkflowType | null
          classification_path: Json | null
          confidence: ConfidenceLevel | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          workflow_type?: WorkflowType | null
          classification_path?: Json | null
          confidence?: ConfidenceLevel | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          workflow_type?: WorkflowType | null
          classification_path?: Json | null
          confidence?: ConfidenceLevel | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          cycle_id: string
          generated_prompt: string | null
          user_edited_prompt: string | null
          final_prompt: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          generated_prompt?: string | null
          user_edited_prompt?: string | null
          final_prompt?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          generated_prompt?: string | null
          user_edited_prompt?: string | null
          final_prompt?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      builds: {
        Row: {
          id: string
          cycle_id: string
          lovable_project_url: string | null
          deployed_url: string | null
          screenshot_urls: string[] | null
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          lovable_project_url?: string | null
          deployed_url?: string | null
          screenshot_urls?: string[] | null
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          lovable_project_url?: string | null
          deployed_url?: string | null
          screenshot_urls?: string[] | null
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      impact_assessments: {
        Row: {
          id: string
          cycle_id: string
          total_users: number | null
          potential_users: number | null
          adoption_rate: number | null
          weekly_active_users: number | null
          returning_users: number | null
          retention_rate: number | null
          pain_before: number | null
          pain_after: number | null
          time_before: string | null
          time_after: string | null
          referral_users: number | null
          referral_rate: number | null
          nps_score: number | null
          impact_score: number | null
          new_problems_discovered: string[] | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          total_users?: number | null
          potential_users?: number | null
          adoption_rate?: number | null
          weekly_active_users?: number | null
          returning_users?: number | null
          retention_rate?: number | null
          pain_before?: number | null
          pain_after?: number | null
          time_before?: string | null
          time_after?: string | null
          referral_users?: number | null
          referral_rate?: number | null
          nps_score?: number | null
          impact_score?: number | null
          new_problems_discovered?: string[] | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          total_users?: number | null
          potential_users?: number | null
          adoption_rate?: number | null
          weekly_active_users?: number | null
          returning_users?: number | null
          retention_rate?: number | null
          pain_before?: number | null
          pain_after?: number | null
          time_before?: string | null
          time_after?: string | null
          referral_users?: number | null
          referral_rate?: number | null
          nps_score?: number | null
          impact_score?: number | null
          new_problems_discovered?: string[] | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // CONVERSATION TABLES
      // ============================================
      conversations: {
        Row: {
          id: string
          cycle_id: string
          step: number
          started_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          step: number
          started_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          step?: number
          started_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: MessageRole
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: MessageRole
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: MessageRole
          content?: string
          created_at?: string
        }
      }

      // ============================================
      // GAMIFICATION TABLES
      // ============================================
      badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          badge_name: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          badge_name: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          badge_name?: string
          earned_at?: string
        }
      }
      skill_progress: {
        Row: {
          id: string
          user_id: string
          skill_area: string
          level: number
          xp: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_area: string
          level?: number
          xp?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_area?: string
          level?: number
          xp?: number
          updated_at?: string
        }
      }

      // ============================================
      // PROBLEM BANK TABLES
      // ============================================
      problem_bank: {
        Row: {
          id: string
          original_cycle_id: string | null
          source_type: ProblemSourceType
          source_year: number
          source_event: string | null
          event_id: string | null
          title: string
          problem_statement: string
          theme: ProblemTheme | null
          sub_theme: string | null
          who_affected: string | null
          when_occurs: string | null
          where_occurs: string | null
          frequency: ProblemFrequency | null
          severity_rating: number | null
          current_workaround: string | null
          validation_status: ValidationStatus
          users_interviewed: number
          desperate_user_count: number
          desperate_user_score: number | null
          institution_id: string | null
          department: string | null
          submitted_by: string | null
          status: ProblemStatus
          is_open_for_attempts: boolean
          best_solution_cycle_id: string | null
          best_solution_url: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          original_cycle_id?: string | null
          source_type?: ProblemSourceType
          source_year?: number
          source_event?: string | null
          event_id?: string | null
          title: string
          problem_statement: string
          theme?: ProblemTheme | null
          sub_theme?: string | null
          who_affected?: string | null
          when_occurs?: string | null
          where_occurs?: string | null
          frequency?: ProblemFrequency | null
          severity_rating?: number | null
          current_workaround?: string | null
          validation_status?: ValidationStatus
          users_interviewed?: number
          desperate_user_count?: number
          desperate_user_score?: number | null
          institution_id?: string | null
          department?: string | null
          submitted_by?: string | null
          status?: ProblemStatus
          is_open_for_attempts?: boolean
          best_solution_cycle_id?: string | null
          best_solution_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          original_cycle_id?: string | null
          source_type?: ProblemSourceType
          source_year?: number
          source_event?: string | null
          event_id?: string | null
          title?: string
          problem_statement?: string
          theme?: ProblemTheme | null
          sub_theme?: string | null
          who_affected?: string | null
          when_occurs?: string | null
          where_occurs?: string | null
          frequency?: ProblemFrequency | null
          severity_rating?: number | null
          current_workaround?: string | null
          validation_status?: ValidationStatus
          users_interviewed?: number
          desperate_user_count?: number
          desperate_user_score?: number | null
          institution_id?: string | null
          department?: string | null
          submitted_by?: string | null
          status?: ProblemStatus
          is_open_for_attempts?: boolean
          best_solution_cycle_id?: string | null
          best_solution_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      problem_attempts: {
        Row: {
          id: string
          problem_id: string
          cycle_id: string | null
          user_id: string | null
          team_name: string | null
          outcome: AttemptOutcome | null
          outcome_notes: string | null
          users_reached: number
          impact_score: number | null
          app_url: string | null
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          cycle_id?: string | null
          user_id?: string | null
          team_name?: string | null
          outcome?: AttemptOutcome | null
          outcome_notes?: string | null
          users_reached?: number
          impact_score?: number | null
          app_url?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          cycle_id?: string | null
          user_id?: string | null
          team_name?: string | null
          outcome?: AttemptOutcome | null
          outcome_notes?: string | null
          users_reached?: number
          impact_score?: number | null
          app_url?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      problem_tags: {
        Row: {
          id: string
          problem_id: string
          tag: string
          tag_type: TagType
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          tag: string
          tag_type?: TagType
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          tag?: string
          tag_type?: TagType
          created_by?: string | null
          created_at?: string
        }
      }
      problem_evidence: {
        Row: {
          id: string
          problem_id: string
          evidence_type: EvidenceType
          content: string
          source_name: string | null
          source_role: string | null
          pain_level: number | null
          collected_at: string | null
          collected_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          evidence_type: EvidenceType
          content: string
          source_name?: string | null
          source_role?: string | null
          pain_level?: number | null
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          evidence_type?: EvidenceType
          content?: string
          source_name?: string | null
          source_role?: string | null
          pain_level?: number | null
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
        }
      }
      problem_similarities: {
        Row: {
          id: string
          problem_id_a: string
          problem_id_b: string
          similarity_score: number
          similarity_type: SimilarityType
          computed_at: string
          algorithm_version: string
        }
        Insert: {
          id?: string
          problem_id_a: string
          problem_id_b: string
          similarity_score: number
          similarity_type?: SimilarityType
          computed_at?: string
          algorithm_version?: string
        }
        Update: {
          id?: string
          problem_id_a?: string
          problem_id_b?: string
          similarity_score?: number
          similarity_type?: SimilarityType
          computed_at?: string
          algorithm_version?: string
        }
      }
      problem_clusters: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string | null
          primary_theme: ProblemTheme | null
          problem_count: number
          avg_severity: number | null
          avg_validation_score: number | null
          cross_institutional: boolean
          institutions_count: number
          status: ClusterStatus
          merged_into_id: string | null
          ai_summary: string | null
          key_patterns: string[] | null
          suggested_actions: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug?: string | null
          primary_theme?: ProblemTheme | null
          problem_count?: number
          avg_severity?: number | null
          avg_validation_score?: number | null
          cross_institutional?: boolean
          institutions_count?: number
          status?: ClusterStatus
          merged_into_id?: string | null
          ai_summary?: string | null
          key_patterns?: string[] | null
          suggested_actions?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string | null
          primary_theme?: ProblemTheme | null
          problem_count?: number
          avg_severity?: number | null
          avg_validation_score?: number | null
          cross_institutional?: boolean
          institutions_count?: number
          status?: ClusterStatus
          merged_into_id?: string | null
          ai_summary?: string | null
          key_patterns?: string[] | null
          suggested_actions?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      problem_cluster_members: {
        Row: {
          cluster_id: string
          problem_id: string
          membership_score: number
          is_centroid: boolean
          added_by: ClusterAddedBy
          added_by_user: string | null
          added_at: string
        }
        Insert: {
          cluster_id: string
          problem_id: string
          membership_score?: number
          is_centroid?: boolean
          added_by?: ClusterAddedBy
          added_by_user?: string | null
          added_at?: string
        }
        Update: {
          cluster_id?: string
          problem_id?: string
          membership_score?: number
          is_centroid?: boolean
          added_by?: ClusterAddedBy
          added_by_user?: string | null
          added_at?: string
        }
      }
      problem_evolution: {
        Row: {
          id: string
          problem_id: string
          version: number
          previous_title: string | null
          new_title: string | null
          previous_statement: string | null
          new_statement: string | null
          change_type: EvolutionChangeType | null
          change_reason: string | null
          changed_by: string | null
          improvement_score: number | null
          changed_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          version?: number
          previous_title?: string | null
          new_title?: string | null
          previous_statement?: string | null
          new_statement?: string | null
          change_type?: EvolutionChangeType | null
          change_reason?: string | null
          changed_by?: string | null
          improvement_score?: number | null
          changed_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          version?: number
          previous_title?: string | null
          new_title?: string | null
          previous_statement?: string | null
          new_statement?: string | null
          change_type?: EvolutionChangeType | null
          change_reason?: string | null
          changed_by?: string | null
          improvement_score?: number | null
          changed_at?: string
        }
      }
      problem_scores: {
        Row: {
          id: string
          problem_id: string
          severity_score: number | null
          validation_score: number | null
          uniqueness_score: number | null
          feasibility_score: number | null
          impact_potential_score: number | null
          composite_score: number | null
          scored_by: ScoredBy
          scored_by_user: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          severity_score?: number | null
          validation_score?: number | null
          uniqueness_score?: number | null
          feasibility_score?: number | null
          impact_potential_score?: number | null
          composite_score?: number | null
          scored_by?: ScoredBy
          scored_by_user?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          severity_score?: number | null
          validation_score?: number | null
          uniqueness_score?: number | null
          feasibility_score?: number | null
          impact_potential_score?: number | null
          composite_score?: number | null
          scored_by?: ScoredBy
          scored_by_user?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      problem_outcomes: {
        Row: {
          id: string
          problem_id: string
          attempt_id: string | null
          outcome_type: OutcomeType
          outcome_description: string | null
          time_to_solution_days: number | null
          iterations_count: number
          user_adoption_rate: number | null
          satisfaction_score: number | null
          users_impacted: number
          time_saved_hours: number
          cost_saved: number
          revenue_generated: number
          what_worked: string | null
          what_didnt_work: string | null
          key_insights: string[]
          recommendations: string[]
          recorded_by: string | null
          recorded_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          attempt_id?: string | null
          outcome_type: OutcomeType
          outcome_description?: string | null
          time_to_solution_days?: number | null
          iterations_count?: number
          user_adoption_rate?: number | null
          satisfaction_score?: number | null
          users_impacted?: number
          time_saved_hours?: number
          cost_saved?: number
          revenue_generated?: number
          what_worked?: string | null
          what_didnt_work?: string | null
          key_insights?: string[]
          recommendations?: string[]
          recorded_by?: string | null
          recorded_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          attempt_id?: string | null
          outcome_type?: OutcomeType
          outcome_description?: string | null
          time_to_solution_days?: number | null
          iterations_count?: number
          user_adoption_rate?: number | null
          satisfaction_score?: number | null
          users_impacted?: number
          time_saved_hours?: number
          cost_saved?: number
          revenue_generated?: number
          what_worked?: string | null
          what_didnt_work?: string | null
          key_insights?: string[]
          recommendations?: string[]
          recorded_by?: string | null
          recorded_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // NIF PIPELINE TABLES
      // ============================================
      nif_candidates: {
        Row: {
          id: string
          problem_id: string
          stage: NIFStage
          identified_by: string | null
          identified_at: string
          screened_at: string | null
          screened_by: string | null
          shortlisted_at: string | null
          shortlisted_by: string | null
          incubation_started_at: string | null
          graduated_at: string | null
          rejected_at: string | null
          decision_notes: string | null
          rejection_reason: string | null
          startup_name: string | null
          startup_status: StartupStatus | null
          startup_website: string | null
          team_members: Json | null
          funding_stage: string | null
          funding_amount: number | null
          funding_currency: string
          jobs_created: number
          revenue_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          stage?: NIFStage
          identified_by?: string | null
          identified_at?: string
          screened_at?: string | null
          screened_by?: string | null
          shortlisted_at?: string | null
          shortlisted_by?: string | null
          incubation_started_at?: string | null
          graduated_at?: string | null
          rejected_at?: string | null
          decision_notes?: string | null
          rejection_reason?: string | null
          startup_name?: string | null
          startup_status?: StartupStatus | null
          startup_website?: string | null
          team_members?: Json | null
          funding_stage?: string | null
          funding_amount?: number | null
          funding_currency?: string
          jobs_created?: number
          revenue_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          stage?: NIFStage
          identified_by?: string | null
          identified_at?: string
          screened_at?: string | null
          screened_by?: string | null
          shortlisted_at?: string | null
          shortlisted_by?: string | null
          incubation_started_at?: string | null
          graduated_at?: string | null
          rejected_at?: string | null
          decision_notes?: string | null
          rejection_reason?: string | null
          startup_name?: string | null
          startup_status?: StartupStatus | null
          startup_website?: string | null
          team_members?: Json | null
          funding_stage?: string | null
          funding_amount?: number | null
          funding_currency?: string
          jobs_created?: number
          revenue_generated?: number
          created_at?: string
          updated_at?: string
        }
      }
      nif_stage_history: {
        Row: {
          id: string
          candidate_id: string
          from_stage: NIFStage | null
          to_stage: NIFStage
          changed_by: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          from_stage?: NIFStage | null
          to_stage: NIFStage
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          from_stage?: NIFStage | null
          to_stage?: NIFStage
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
      }

      // ============================================
      // AI REFINEMENT & CASE STUDY TABLES
      // ============================================
      ai_refinements: {
        Row: {
          id: string
          problem_id: string
          original_statement: string
          suggested_statement: string
          refinement_type: RefinementType
          refinement_reason: string | null
          confidence_score: number | null
          based_on: RefinementBasedOn | null
          source_problem_ids: string[]
          status: RefinementStatus
          user_response_notes: string | null
          responded_by: string | null
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          original_statement: string
          suggested_statement: string
          refinement_type?: RefinementType
          refinement_reason?: string | null
          confidence_score?: number | null
          based_on?: RefinementBasedOn | null
          source_problem_ids?: string[]
          status?: RefinementStatus
          user_response_notes?: string | null
          responded_by?: string | null
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          original_statement?: string
          suggested_statement?: string
          refinement_type?: RefinementType
          refinement_reason?: string | null
          confidence_score?: number | null
          based_on?: RefinementBasedOn | null
          source_problem_ids?: string[]
          status?: RefinementStatus
          user_response_notes?: string | null
          responded_by?: string | null
          responded_at?: string | null
          created_at?: string
        }
      }
      case_studies: {
        Row: {
          id: string
          problem_id: string
          attempt_id: string | null
          outcome_id: string | null
          title: string
          slug: string
          summary: string | null
          full_content: string | null
          section_problem: string | null
          section_context: string | null
          section_approach: string | null
          section_solution: string | null
          section_implementation: string | null
          section_impact: string | null
          section_lessons: string | null
          section_recommendations: string | null
          theme: ProblemTheme | null
          tags: string[]
          difficulty_level: DifficultyLevel | null
          learning_objectives: string[]
          key_takeaways: string[]
          discussion_questions: string[]
          featured_image_url: string | null
          media_urls: string[]
          status: CaseStudyStatus
          published_at: string | null
          generated_by: 'ai' | 'manual' | 'hybrid' | null
          reviewed_by: string | null
          approved_by: string | null
          view_count: number
          like_count: number
          share_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          attempt_id?: string | null
          outcome_id?: string | null
          title: string
          slug: string
          summary?: string | null
          full_content?: string | null
          section_problem?: string | null
          section_context?: string | null
          section_approach?: string | null
          section_solution?: string | null
          section_implementation?: string | null
          section_impact?: string | null
          section_lessons?: string | null
          section_recommendations?: string | null
          theme?: ProblemTheme | null
          tags?: string[]
          difficulty_level?: DifficultyLevel | null
          learning_objectives?: string[]
          key_takeaways?: string[]
          discussion_questions?: string[]
          featured_image_url?: string | null
          media_urls?: string[]
          status?: CaseStudyStatus
          published_at?: string | null
          generated_by?: 'ai' | 'manual' | 'hybrid' | null
          reviewed_by?: string | null
          approved_by?: string | null
          view_count?: number
          like_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          attempt_id?: string | null
          outcome_id?: string | null
          title?: string
          slug?: string
          summary?: string | null
          full_content?: string | null
          section_problem?: string | null
          section_context?: string | null
          section_approach?: string | null
          section_solution?: string | null
          section_implementation?: string | null
          section_impact?: string | null
          section_lessons?: string | null
          section_recommendations?: string | null
          theme?: ProblemTheme | null
          tags?: string[]
          difficulty_level?: DifficultyLevel | null
          learning_objectives?: string[]
          key_takeaways?: string[]
          discussion_questions?: string[]
          featured_image_url?: string | null
          media_urls?: string[]
          status?: CaseStudyStatus
          published_at?: string | null
          generated_by?: 'ai' | 'manual' | 'hybrid' | null
          reviewed_by?: string | null
          approved_by?: string | null
          view_count?: number
          like_count?: number
          share_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      learning_patterns: {
        Row: {
          id: string
          pattern_type: LearningPatternType
          title: string
          description: string
          conditions: Json | null
          supporting_outcomes: number
          confidence_score: number | null
          sample_problem_ids: string[]
          applicable_themes: ProblemTheme[]
          applicable_stages: NIFStage[]
          action_items: string[]
          discovered_at: string
          last_validated: string
          is_active: boolean
        }
        Insert: {
          id?: string
          pattern_type: LearningPatternType
          title: string
          description: string
          conditions?: Json | null
          supporting_outcomes?: number
          confidence_score?: number | null
          sample_problem_ids?: string[]
          applicable_themes?: ProblemTheme[]
          applicable_stages?: NIFStage[]
          action_items?: string[]
          discovered_at?: string
          last_validated?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          pattern_type?: LearningPatternType
          title?: string
          description?: string
          conditions?: Json | null
          supporting_outcomes?: number
          confidence_score?: number | null
          sample_problem_ids?: string[]
          applicable_themes?: ProblemTheme[]
          applicable_stages?: NIFStage[]
          action_items?: string[]
          discovered_at?: string
          last_validated?: string
          is_active?: boolean
        }
      }
      flywheel_summary: {
        Row: {
          id: string
          user_id: string | null
          total_problems: number
          problems_with_outcomes: number
          outcome_rate: number
          success_rate: number
          average_solution_time_days: number | null
          total_users_impacted: number
          total_time_saved_hours: number
          total_cost_saved: number
          total_revenue_generated: number
          total_case_studies: number
          published_case_studies: number
          total_case_study_views: number
          total_refinements: number
          refinements_accepted: number
          refinement_acceptance_rate: number
          total_patterns: number
          active_patterns: number
          computed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          total_problems?: number
          problems_with_outcomes?: number
          outcome_rate?: number
          success_rate?: number
          average_solution_time_days?: number | null
          total_users_impacted?: number
          total_time_saved_hours?: number
          total_cost_saved?: number
          total_revenue_generated?: number
          total_case_studies?: number
          published_case_studies?: number
          total_case_study_views?: number
          total_refinements?: number
          refinements_accepted?: number
          refinement_acceptance_rate?: number
          total_patterns?: number
          active_patterns?: number
          computed_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          total_problems?: number
          problems_with_outcomes?: number
          outcome_rate?: number
          success_rate?: number
          average_solution_time_days?: number | null
          total_users_impacted?: number
          total_time_saved_hours?: number
          total_cost_saved?: number
          total_revenue_generated?: number
          total_case_studies?: number
          published_case_studies?: number
          total_case_study_views?: number
          total_refinements?: number
          refinements_accepted?: number
          refinement_acceptance_rate?: number
          total_patterns?: number
          active_patterns?: number
          computed_at?: string
        }
      }

      // ============================================
      // ADMIN & AUDIT TABLES
      // ============================================
      admin_activity_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
      admin_cycle_notes: {
        Row: {
          id: string
          cycle_id: string
          admin_id: string
          note: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          admin_id: string
          note: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          admin_id?: string
          note?: string
          is_internal?: boolean
          created_at?: string
        }
      }
      cycle_reviews: {
        Row: {
          id: string
          cycle_id: string
          reviewer_id: string
          rating: number | null
          feedback: string | null
          strengths: string[] | null
          improvements: string[] | null
          is_highlighted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          reviewer_id: string
          rating?: number | null
          feedback?: string | null
          strengths?: string[] | null
          improvements?: string[] | null
          is_highlighted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          reviewer_id?: string
          rating?: number | null
          feedback?: string | null
          strengths?: string[] | null
          improvements?: string[] | null
          is_highlighted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      impersonation_logs: {
        Row: {
          id: string
          admin_id: string
          target_user_id: string
          action: 'start' | 'end'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          target_user_id: string
          action: 'start' | 'end'
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          target_user_id?: string
          action?: 'start' | 'end'
          reason?: string | null
          created_at?: string
        }
      }

      // ============================================
      // APPATHON SUBMISSION TABLES
      // ============================================
      appathon_submissions: {
        Row: {
          id: string
          event_id: string
          user_id: string
          cycle_id: string | null
          title: string
          description: string | null
          video_url: string | null
          app_url: string | null
          status: SubmissionStatus
          score: number | null
          feedback: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          cycle_id?: string | null
          title: string
          description?: string | null
          video_url?: string | null
          app_url?: string | null
          status?: SubmissionStatus
          score?: number | null
          feedback?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          cycle_id?: string | null
          title?: string
          description?: string | null
          video_url?: string | null
          app_url?: string | null
          status?: SubmissionStatus
          score?: number | null
          feedback?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // CREDENTIALS TABLE
      // ============================================
      provider_credentials: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          token_type: string | null
          scope: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          token_type?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          token_type?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      admin_pending_change_requests: {
        Row: {
          id: string | null
          user_id: string | null
          from_institution_id: string | null
          to_institution_id: string | null
          status: ChangeRequestStatus | null
          reason: string | null
          created_at: string | null
          user_email: string | null
          user_name: string | null
          from_institution: string | null
          to_institution: string | null
        }
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<string, never>
        Returns: UserRole | null
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: UserRole | null
      }
      get_admin_role: {
        Args: { user_id_param: string }
        Returns: { role: UserRole; admin_type: string | null; scope_id: string | null }[]
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: Database['public']['Tables']['users']['Row'] | null
      }
      get_user_by_id_admin: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_by_email_admin: {
        Args: { target_email: string }
        Returns: Json
      }
      get_user_for_impersonation: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_all_users_admin: {
        Args: {
          caller_user_id: string
          search_term?: string | null
          institution_filter?: string | null
          role_filter?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      update_user_admin: {
        Args: {
          target_user_id: string
          new_name?: string | null
          new_institution?: string | null
          new_department?: string | null
          new_role?: string | null
          new_user_category?: string | null
        }
        Returns: Json
      }
      get_all_cycles_admin: {
        Args: {
          caller_user_id: string
          status_filter?: string | null
          search_term?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      get_admin_activity_logs: {
        Args: {
          action_filter?: string | null
          entity_type_filter?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      get_admin_events: {
        Args: { user_id_param: string }
        Returns: { event_id: string; event_slug: string; event_name: string; role: string }[]
      }
      get_event_submissions: {
        Args: {
          event_id_param: string
          status_filter?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      get_event_submissions_public: {
        Args: { event_slug_param: string }
        Returns: Json[]
      }
      update_submission_review: {
        Args: {
          submission_id: string
          new_status: string
          new_score?: number | null
          new_feedback?: string | null
        }
        Returns: Json
      }
      get_all_problems_admin: {
        Args: {
          caller_user_id: string
          theme_filter?: string | null
          status_filter?: string | null
          validation_status_filter?: string | null
          institution_filter?: string | null
          search_term?: string | null
          sort_field?: string
          sort_direction?: string
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      get_problem_attempt_counts: {
        Args: { problem_ids: string[] }
        Returns: { problem_id: string; attempt_count: number }[]
      }
      get_eligible_cycles_admin: {
        Args: {
          caller_user_id: string
          event_id_filter?: string | null
        }
        Returns: Json[]
      }
      get_saved_cycle_ids: {
        Args: { user_id_param: string }
        Returns: { cycle_id: string }[]
      }
      find_similar_problems: {
        Args: { source_problem_id: string }
        Returns: Json[]
      }
      get_global_problems_for_curation: {
        Args: {
          event_id_param: string
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      curate_problem_for_event: {
        Args: {
          problem_id_param: string
          event_id_param: string
          action: 'add' | 'remove'
        }
        Returns: boolean
      }
      get_nif_pipeline_admin: {
        Args: {
          caller_user_id: string
          stage_filter?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: Json[]
      }
      get_nif_pipeline_stats_admin: {
        Args: { caller_user_id: string }
        Returns: Json
      }
      update_user_active_event: {
        Args: {
          user_id_param: string
          event_id_param: string
        }
        Returns: boolean
      }
      clear_user_active_event: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      set_user_institution: {
        Args: {
          user_id_param: string
          institution_id_param: string
        }
        Returns: boolean
      }
      get_user_institution: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_event_stats: {
        Args: { event_id_param: string }
        Returns: Json
      }
      get_event_institution_stats: {
        Args: { event_id_param: string }
        Returns: Json[]
      }
      get_all_event_participant_counts: {
        Args: Record<string, never>
        Returns: { event_id: string; participant_count: number }[]
      }
      search_users_for_team: {
        Args: {
          search_query: string
          exclude_user_id?: string | null
          result_limit?: number
        }
        Returns: { id: string; email: string; name: string | null; institution: string | null }[]
      }
      compute_flywheel_metrics: {
        Args: { user_id_param?: string | null }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      user_category: UserCategory
      cycle_status: CycleStatus
      message_role: MessageRole
      problem_frequency: ProblemFrequency
      value_quadrant: ValueQuadrant
      value_decision: ValueDecision
      workflow_type: WorkflowType
      confidence_level: ConfidenceLevel
      institution_type: InstitutionType
      change_request_status: ChangeRequestStatus
      problem_theme: ProblemTheme
      problem_status: ProblemStatus
      validation_status: ValidationStatus
      problem_source_type: ProblemSourceType
      attempt_outcome: AttemptOutcome
      tag_type: TagType
      evidence_type: EvidenceType
      similarity_type: SimilarityType
      cluster_status: ClusterStatus
      cluster_added_by: ClusterAddedBy
      evolution_change_type: EvolutionChangeType
      nif_stage: NIFStage
      startup_status: StartupStatus
      scored_by: ScoredBy
      interest_level: InterestLevel
      partner_type: PartnerType
      research_type: ResearchType
      research_topic_status: ResearchTopicStatus
      outcome_type: OutcomeType
      refinement_type: RefinementType
      refinement_based_on: RefinementBasedOn
      refinement_status: RefinementStatus
      case_study_status: CaseStudyStatus
      difficulty_level: DifficultyLevel
      learning_pattern_type: LearningPatternType
      submission_status: SubmissionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// HELPER TYPES
// ============================================

// Table row types for easy access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Function argument and return types
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Common type aliases
export type User = Tables<'users'>
export type Event = Tables<'events'>
export type Cycle = Tables<'cycles'>
export type Institution = Tables<'institutions'>
export type ProblemBank = Tables<'problem_bank'>
export type AdminActivityLog = Tables<'admin_activity_logs'>
