-- ============================================
-- FIX: ALLOW JUDGES TO VIEW ASSIGNED SUBMISSIONS
-- ============================================
-- Issue: Judges get "Failed to load submission" when trying to score
-- because appathon_submissions RLS only allows owner/superadmin/institution_admin
--
-- Fix: Add policy allowing judges to SELECT submissions assigned to their track
-- ============================================

-- Add RLS policy for judges to view submissions they are assigned to judge
DROP POLICY IF EXISTS "Judges can view assigned submissions" ON appathon_submissions;
CREATE POLICY "Judges can view assigned submissions"
  ON appathon_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM submission_track_assignments sta
      JOIN track_judges tj ON tj.track_id = sta.track_id
      WHERE sta.submission_id = appathon_submissions.id
        AND tj.user_id = auth.uid()
    )
  );

-- Also ensure judges can view submissions when trial mode is enabled
-- This helps during testing/demo without requiring full track assignment
DROP POLICY IF EXISTS "Trial mode allows judges to view all event submissions" ON appathon_submissions;
CREATE POLICY "Trial mode allows judges to view all event submissions"
  ON appathon_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM track_judges tj
      JOIN judging_tracks jt ON jt.id = tj.track_id
      JOIN events e ON e.id = jt.event_id
      WHERE tj.user_id = auth.uid()
        AND jt.event_id = appathon_submissions.event_id
        AND (e.config->>'judging_trial_mode')::boolean = true
    )
  );
