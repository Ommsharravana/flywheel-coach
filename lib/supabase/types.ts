export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          institution: string
          department: string | null
          year_of_study: number | null
          role: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin'
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
          department?: string | null
          year_of_study?: number | null
          role?: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin'
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
          department?: string | null
          year_of_study?: number | null
          role?: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin'
          onboarding_completed?: boolean
          language?: 'en' | 'ta'
          active_event_id?: string | null
          gemini_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
      cycles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          status: 'active' | 'completed' | 'abandoned'
          current_step: number
          started_at: string
          completed_at: string | null
          impact_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          status?: 'active' | 'completed' | 'abandoned'
          current_step?: number
          started_at?: string
          completed_at?: string | null
          impact_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          status?: 'active' | 'completed' | 'abandoned'
          current_step?: number
          started_at?: string
          completed_at?: string | null
          impact_score?: number | null
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
          frequency: 'daily' | 'weekly' | 'monthly' | 'occasional' | null
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
          frequency?: 'daily' | 'weekly' | 'monthly' | 'occasional' | null
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
          frequency?: 'daily' | 'weekly' | 'monthly' | 'occasional' | null
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
          quadrant: 'quick-win' | 'strategic' | 'selective' | 'skip' | null
          decision: 'proceed' | 'iterate' | 'pivot' | 'stop' | null
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
          quadrant?: 'quick-win' | 'strategic' | 'selective' | 'skip' | null
          decision?: 'proceed' | 'iterate' | 'pivot' | 'stop' | null
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
          quadrant?: 'quick-win' | 'strategic' | 'selective' | 'skip' | null
          decision?: 'proceed' | 'iterate' | 'pivot' | 'stop' | null
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
          workflow_type: 'AUDIT' | 'GENERATION' | 'TRANSFORMATION' | 'CLASSIFICATION' | 'EXTRACTION' | 'SYNTHESIS' | 'PREDICTION' | 'RECOMMENDATION' | 'MONITORING' | 'ORCHESTRATION' | null
          classification_path: Json | null
          confidence: 'high' | 'medium' | 'low' | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          workflow_type?: 'AUDIT' | 'GENERATION' | 'TRANSFORMATION' | 'CLASSIFICATION' | 'EXTRACTION' | 'SYNTHESIS' | 'PREDICTION' | 'RECOMMENDATION' | 'MONITORING' | 'ORCHESTRATION' | null
          classification_path?: Json | null
          confidence?: 'high' | 'medium' | 'low' | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          workflow_type?: 'AUDIT' | 'GENERATION' | 'TRANSFORMATION' | 'CLASSIFICATION' | 'EXTRACTION' | 'SYNTHESIS' | 'PREDICTION' | 'RECOMMENDATION' | 'MONITORING' | 'ORCHESTRATION' | null
          classification_path?: Json | null
          confidence?: 'high' | 'medium' | 'low' | null
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
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
        }
      }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
