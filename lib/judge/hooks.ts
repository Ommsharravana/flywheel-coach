'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  getJudgeAccess,
  getOrCreateScore,
  updateScore,
  submitScore,
  getSubmissionForScoring,
  type JudgeAccessResult,
} from './actions'
import type { JudgeScore, JudgeScoreUpdate } from '@/lib/supabase/types'

/**
 * Hook to get judge access and track data
 */
export function useJudgeAccess() {
  const [data, setData] = useState<JudgeAccessResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccess = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getJudgeAccess()
      setData(result)
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error fetching judge access:', err)
      setError('Failed to load judge data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccess()
  }, [fetchAccess])

  return { data, loading, error, refresh: fetchAccess }
}

/**
 * Hook to manage scoring for a specific submission
 */
export function useSubmissionScore(submissionId: string) {
  const [score, setScore] = useState<JudgeScore | null>(null)
  const [submission, setSubmission] = useState<{
    id: string
    submission_number: string
    app_name: string
    category: string
    problem_statement: string | null
    live_url: string | null
    demo_video_url: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track pending changes for debounced save
  const pendingChanges = useRef<JudgeScoreUpdate | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch score and submission in parallel
        const [scoreResult, submissionResult] = await Promise.all([
          getOrCreateScore(submissionId),
          getSubmissionForScoring(submissionId),
        ])

        if (scoreResult.error) {
          setError(scoreResult.error)
        } else {
          setScore(scoreResult.score)
        }

        if (submissionResult.error) {
          setError(submissionResult.error)
        } else {
          setSubmission(submissionResult.submission)
        }
      } catch (err) {
        console.error('Error loading score data:', err)
        setError('Failed to load scoring data')
      } finally {
        setLoading(false)
      }
    }

    if (submissionId) {
      loadData()
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
      }
    }
  }, [submissionId])

  // Debounced save function
  const debouncedSave = useCallback(async (updates: JudgeScoreUpdate) => {
    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }

    // Merge with pending changes
    pendingChanges.current = {
      ...pendingChanges.current,
      ...updates,
    }

    // Schedule save after 1 second of inactivity
    saveTimeout.current = setTimeout(async () => {
      if (!pendingChanges.current) return

      setSaving(true)
      const result = await updateScore(submissionId, pendingChanges.current)
      setSaving(false)

      if (result.success && result.score) {
        setScore(result.score)
        pendingChanges.current = null
      } else if (result.error) {
        toast.error(result.error)
      }
    }, 1000)
  }, [submissionId])

  // Update a single field
  const updateField = useCallback((field: keyof JudgeScoreUpdate, value: number | boolean | string | null) => {
    // Optimistically update local state
    setScore((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })

    // Schedule save
    debouncedSave({ [field]: value })
  }, [debouncedSave])

  // Submit the score
  const handleSubmit = useCallback(async () => {
    // First, save any pending changes immediately
    if (pendingChanges.current) {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
      }
      setSaving(true)
      await updateScore(submissionId, pendingChanges.current)
      pendingChanges.current = null
      setSaving(false)
    }

    setSaving(true)
    const result = await submitScore(submissionId)
    setSaving(false)

    if (result.success && result.score) {
      setScore(result.score)
      toast.success('Score submitted successfully!')
      return true
    } else if (result.error) {
      toast.error(result.error)
      return false
    }
    return false
  }, [submissionId])

  // Check if all required fields are filled
  const isComplete = score
    ? score.problem_impact !== null &&
      score.solution_innovation !== null &&
      score.working_prototype !== null &&
      score.user_validation !== null &&
      score.presentation_quality !== null &&
      score.bioconvergence_alignment !== null
    : false

  // Check if already submitted
  const isSubmitted = score?.submitted_at !== null

  return {
    score,
    submission,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    isComplete,
    isSubmitted,
  }
}

/**
 * Hook for countdown timer to panel reveal
 */
export function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const target = new Date(targetDate)

    function updateCountdown() {
      const now = new Date()
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft(null)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    // Initial update
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return { timeLeft, isExpired }
}
