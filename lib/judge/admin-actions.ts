'use server'

import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'

// APPATHON 2.0 Event ID
const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462'

export interface JudgeInfo {
  user_id: string
  user_email: string
  user_name: string | null
  track_id: string
  track_name: string
  track_theme: string
  is_lead: boolean
  assigned_at: string
}

export interface TrackInfo {
  id: string
  name: string
  theme: string
  description: string | null
  room_location: string | null
  demo_order: number
  is_active: boolean
}

/**
 * Get trial mode status for the event
 */
export async function getTrialModeStatus(): Promise<{
  isTrialMode: boolean
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_judging_trial_mode', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error getting trial mode:', error)
    return { isTrialMode: false, error: 'Failed to get trial mode status' }
  }

  return { isTrialMode: data === true }
}

/**
 * Toggle trial mode for the event (admin only)
 */
export async function setTrialMode(enabled: boolean): Promise<{
  success: boolean
  isTrialMode?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('set_judging_trial_mode', {
    p_event_id: APPATHON_EVENT_ID,
    p_enabled: enabled,
  })

  if (error) {
    console.error('Error setting trial mode:', error)
    return { success: false, error: error.message || 'Failed to set trial mode' }
  }

  return { success: data === true, isTrialMode: enabled }
}

/**
 * Get all judges for the event
 */
export async function getEventJudges(): Promise<{
  judges: JudgeInfo[]
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_event_judges', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error getting judges:', error)
    return { judges: [], error: 'Failed to load judges' }
  }

  return { judges: (data || []) as JudgeInfo[] }
}

/**
 * Get all judging tracks for the event
 */
export async function getJudgingTracks(): Promise<{
  tracks: TrackInfo[]
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('judging_tracks')
    .select('id, name, theme, description, room_location, demo_order, is_active')
    .eq('event_id', APPATHON_EVENT_ID)
    .order('demo_order')

  if (error) {
    console.error('Error getting tracks:', error)
    return { tracks: [], error: 'Failed to load tracks' }
  }

  return { tracks: (data || []) as TrackInfo[] }
}

/**
 * Assign a judge to a track
 */
export async function assignJudge(
  userEmail: string,
  trackTheme: string,
  isLead: boolean = false
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('assign_judge_to_track', {
    p_user_email: userEmail,
    p_track_theme: trackTheme,
    p_event_id: APPATHON_EVENT_ID,
    p_is_lead: isLead,
  })

  if (error) {
    console.error('Error assigning judge:', error)
    return { success: false, error: error.message || 'Failed to assign judge' }
  }

  const result = data?.[0]
  if (!result?.success) {
    return { success: false, error: result?.message || 'Failed to assign judge' }
  }

  return { success: true, message: result.message }
}

/**
 * Remove a judge from a track
 */
export async function removeJudge(
  userEmail: string,
  trackTheme: string
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('remove_judge_from_track', {
    p_user_email: userEmail,
    p_track_theme: trackTheme,
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error removing judge:', error)
    return { success: false, error: error.message || 'Failed to remove judge' }
  }

  const result = data?.[0]
  if (!result?.success) {
    return { success: false, error: result?.message || 'Failed to remove judge' }
  }

  return { success: true, message: result.message }
}

/**
 * Auto-assign all submissions to tracks based on category
 */
export async function autoAssignSubmissions(): Promise<{
  success: boolean
  stats?: {
    total: number
    successful: number
    alreadyAssigned: number
    failed: number
    failures: Array<{ submission_id: string; category: string; error: string }>
  }
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('auto_assign_all_submissions', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error auto-assigning submissions:', error)
    return { success: false, error: error.message || 'Failed to auto-assign submissions' }
  }

  const result = data?.[0]
  return {
    success: true,
    stats: {
      total: result?.total_processed || 0,
      successful: result?.successful || 0,
      alreadyAssigned: result?.already_assigned || 0,
      failed: result?.failed || 0,
      failures: result?.failures || [],
    },
  }
}

/**
 * Get track assignment summary
 */
export async function getTrackAssignmentSummary(): Promise<{
  tracks: Array<{
    track_id: string
    track_name: string
    theme: string
    assigned_count: number
    pending_count: number
    presenting_count: number
    completed_count: number
    skipped_count: number
  }>
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('track_assignment_summary')
    .select('*')

  if (error) {
    console.error('Error getting assignment summary:', error)
    return { tracks: [], error: 'Failed to load assignment summary' }
  }

  return { tracks: data || [] }
}

/**
 * Get results reveal status
 */
export async function getResultsRevealStatus(): Promise<{
  isRevealed: boolean
  revealTime: string | null
  error?: string
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_results_reveal_status', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error getting reveal status:', error)
    return { isRevealed: false, revealTime: null, error: 'Failed to get reveal status' }
  }

  const result = data?.[0]
  return {
    isRevealed: result?.is_revealed ?? false,
    revealTime: result?.reveal_time ?? null,
  }
}

/**
 * Reveal results to the public (admin only)
 */
export async function revealResults(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('reveal_results', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error revealing results:', error)
    return { success: false, error: error.message || 'Failed to reveal results' }
  }

  const result = data?.[0]
  return {
    success: result?.success ?? false,
    message: result?.message,
  }
}

/**
 * Hide results from public view (admin only)
 */
export async function hideResults(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('hide_results', {
    p_event_id: APPATHON_EVENT_ID,
  })

  if (error) {
    console.error('Error hiding results:', error)
    return { success: false, error: error.message || 'Failed to hide results' }
  }

  const result = data?.[0]
  return {
    success: result?.success ?? false,
    message: result?.message,
  }
}
