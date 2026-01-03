'use server'

import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'
import type {
  JudgingTrack,
  JudgeScore,
  JudgeScoreInsert,
  JudgeScoreUpdate,
  JudgeSubmission,
  JudgeTrackWithSubmissions,
} from '@/lib/supabase/types'

// APPATHON 2.0 Event ID
const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462'

// Demo Day reveal time: January 7, 2026 at 9:30 AM IST
const PANEL_REVEAL_TIME = new Date('2026-01-07T09:30:00+05:30')

export interface JudgeAccessResult {
  isJudge: boolean
  isPanelRevealed: boolean
  isTrialMode: boolean
  revealTime: string
  trackData: JudgeTrackWithSubmissions | null
  error?: string
}

/**
 * Check if trial mode is enabled for the event
 */
async function checkTrialMode(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_judging_trial_mode', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error checking trial mode:', error)
    return false
  }

  return data === true
}

/**
 * Check if the current user is assigned as a judge and get their track data
 */
export async function getJudgeAccess(): Promise<JudgeAccessResult> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return {
      isJudge: false,
      isPanelRevealed: false,
      isTrialMode: false,
      revealTime: PANEL_REVEAL_TIME.toISOString(),
      trackData: null,
      error: 'Not authenticated',
    }
  }

  // Check trial mode first
  const isTrialMode = await checkTrialMode(supabase)

  // Check if user is assigned as a judge in any track
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: judgeAssignment, error: judgeError } = await (supabase as any)
    .from('track_judges')
    .select(`
      id,
      track_id,
      user_id,
      is_lead,
      assigned_at,
      track:judging_tracks!inner (
        id,
        event_id,
        name,
        theme,
        description,
        room_location,
        demo_order,
        is_active,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', effectiveUser.id)
    .eq('track.event_id', APPATHON_EVENT_ID)
    .maybeSingle()

  if (judgeError) {
    console.error('Error checking judge assignment:', judgeError)
    return {
      isJudge: false,
      isPanelRevealed: false,
      isTrialMode,
      revealTime: PANEL_REVEAL_TIME.toISOString(),
      trackData: null,
      error: 'Failed to check judge assignment',
    }
  }

  if (!judgeAssignment) {
    return {
      isJudge: false,
      isPanelRevealed: false,
      isTrialMode,
      revealTime: PANEL_REVEAL_TIME.toISOString(),
      trackData: null,
    }
  }

  // Check if panel is revealed (after 9:30 AM on Jan 7 OR trial mode enabled)
  const now = new Date()
  const isPanelRevealed = now >= PANEL_REVEAL_TIME || isTrialMode

  if (!isPanelRevealed) {
    return {
      isJudge: true,
      isPanelRevealed: false,
      isTrialMode,
      revealTime: PANEL_REVEAL_TIME.toISOString(),
      trackData: null,
    }
  }

  // Get submissions for this track using the helper function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissions, error: subError } = await (supabase as any)
    .rpc('get_judge_submissions', {
      p_user_id: effectiveUser.id,
      p_event_id: APPATHON_EVENT_ID,
    })

  if (subError) {
    console.error('Error getting judge submissions:', subError)
    return {
      isJudge: true,
      isPanelRevealed: true,
      isTrialMode,
      revealTime: PANEL_REVEAL_TIME.toISOString(),
      trackData: null,
      error: 'Failed to load submissions',
    }
  }

  // Type assertion for the track data
  const trackData = judgeAssignment.track as unknown as JudgingTrack

  return {
    isJudge: true,
    isPanelRevealed: true,
    isTrialMode,
    revealTime: PANEL_REVEAL_TIME.toISOString(),
    trackData: {
      track: trackData,
      submissions: (submissions || []) as JudgeSubmission[],
      judge_info: {
        is_lead: judgeAssignment.is_lead,
        assigned_at: judgeAssignment.assigned_at,
      },
    },
  }
}

/**
 * Get or create a score record for a submission
 */
export async function getOrCreateScore(submissionId: string): Promise<{
  score: JudgeScore | null
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { score: null, error: 'Not authenticated' }
  }

  // First, try to get existing score
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingScore, error: fetchError } = await (supabase as any)
    .from('judge_scores')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('judge_id', effectiveUser.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching score:', fetchError)
    return { score: null, error: 'Failed to fetch score' }
  }

  if (existingScore) {
    return { score: existingScore as JudgeScore }
  }

  // Get the judge's track
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trackId } = await (supabase as any)
    .rpc('get_judge_track', {
      p_user_id: effectiveUser.id,
      p_event_id: APPATHON_EVENT_ID,
    })

  // Create new score record
  const newScore: JudgeScoreInsert = {
    submission_id: submissionId,
    judge_id: effectiveUser.id,
    track_id: trackId || null,
    problem_impact: null,
    solution_innovation: null,
    working_prototype: null,
    user_validation: null,
    presentation_quality: null,
    bioconvergence_alignment: null,
    bonus_cross_disciplinary: false,
    bonus_cross_institutional: false,
    bonus_first_year: false,
    bonus_user_testimonials: false,
    notes: null,
    strengths: null,
    improvements: null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: createdScore, error: createError } = await (supabase as any)
    .from('judge_scores')
    .insert(newScore as any)
    .select()
    .single()

  if (createError) {
    console.error('Error creating score:', createError)
    return { score: null, error: 'Failed to create score record' }
  }

  return { score: createdScore as JudgeScore }
}

/**
 * Update a judge's score for a submission (auto-save)
 */
export async function updateScore(
  submissionId: string,
  updates: JudgeScoreUpdate
): Promise<{ success: boolean; score?: JudgeScore; error?: string }> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('judge_scores')
    .update(updates)
    .eq('submission_id', submissionId)
    .eq('judge_id', effectiveUser.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating score:', error)
    return { success: false, error: 'Failed to save score' }
  }

  return { success: true, score: data as JudgeScore }
}

/**
 * Submit a score (mark as finalized)
 */
export async function submitScore(submissionId: string): Promise<{
  success: boolean
  score?: JudgeScore
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify all required fields are filled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: score, error: fetchError } = await (supabase as any)
    .from('judge_scores')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('judge_id', effectiveUser.id)
    .single()

  if (fetchError || !score) {
    return { success: false, error: 'Score not found' }
  }

  // Check required fields
  const requiredFields = [
    'problem_impact',
    'solution_innovation',
    'working_prototype',
    'user_validation',
    'presentation_quality',
    'bioconvergence_alignment',
  ] as const

  const missingFields = requiredFields.filter((field) => score[field] === null)
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Please score all criteria before submitting. Missing: ${missingFields.join(', ')}`,
    }
  }

  // Mark as submitted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedScore, error: updateError } = await (supabase as any)
    .from('judge_scores')
    .update({ submitted_at: new Date().toISOString() })
    .eq('submission_id', submissionId)
    .eq('judge_id', effectiveUser.id)
    .select()
    .single()

  if (updateError) {
    console.error('Error submitting score:', updateError)
    return { success: false, error: 'Failed to submit score' }
  }

  return { success: true, score: updatedScore as JudgeScore }
}

/**
 * Get submission details for scoring
 */
export async function getSubmissionForScoring(submissionId: string): Promise<{
  submission: {
    id: string
    submission_number: string
    app_name: string
    category: string
    problem_statement: string | null
    app_url: string | null
    video_url: string | null
  } | null
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('appathon_submissions')
    .select(`
      id,
      submission_number,
      app_name,
      category,
      problem_statement,
      app_url,
      video_url
    `)
    .eq('id', submissionId)
    .single()

  if (error) {
    console.error('Error fetching submission:', error)
    return { submission: null, error: 'Failed to load submission' }
  }

  return { submission: data }
}
