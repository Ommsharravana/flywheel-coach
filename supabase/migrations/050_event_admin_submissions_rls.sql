-- Add RLS policies for event admins/reviewers to access submissions
-- This enables:
-- 1. Event admins to view AND update all submissions for their event
-- 2. Event reviewers (judges) to view AND score submissions for their event

-- ============================================
-- POLICIES FOR EVENT ADMINS (Full Access)
-- ============================================

-- Event admins can view submissions for their events
DROP POLICY IF EXISTS "Event admins can view event submissions" ON appathon_submissions;
CREATE POLICY "Event admins can view event submissions"
  ON appathon_submissions FOR SELECT
  USING (has_event_access(event_id, 'admin'));

-- Event admins can update submissions for their events (status, review, scoring)
DROP POLICY IF EXISTS "Event admins can update event submissions" ON appathon_submissions;
CREATE POLICY "Event admins can update event submissions"
  ON appathon_submissions FOR UPDATE
  USING (has_event_access(event_id, 'admin'));

-- ============================================
-- POLICIES FOR EVENT REVIEWERS (Judges)
-- ============================================

-- Event reviewers can view submissions for their events
DROP POLICY IF EXISTS "Event reviewers can view event submissions" ON appathon_submissions;
CREATE POLICY "Event reviewers can view event submissions"
  ON appathon_submissions FOR SELECT
  USING (has_event_access(event_id, 'reviewer'));

-- Event reviewers can update submissions (for scoring and review notes only)
-- The application layer will enforce that they can only update score/review fields
DROP POLICY IF EXISTS "Event reviewers can review event submissions" ON appathon_submissions;
CREATE POLICY "Event reviewers can review event submissions"
  ON appathon_submissions FOR UPDATE
  USING (has_event_access(event_id, 'reviewer'));

-- ============================================
-- HELPER FUNCTION: Get submissions for an event
-- ============================================

CREATE OR REPLACE FUNCTION get_event_submissions(target_event_id UUID)
RETURNS TABLE (
  id UUID,
  cycle_id UUID,
  event_id UUID,
  user_id UUID,
  participation_type TEXT,
  team_name TEXT,
  team_members JSONB,
  senior_learner JSONB,
  applicant_name TEXT,
  applicant_email TEXT,
  applicant_phone TEXT,
  institution_name TEXT,
  institution_short_name TEXT,
  department TEXT,
  year_of_study TEXT,
  app_name TEXT,
  problem_statement TEXT,
  solution_summary TEXT,
  live_url TEXT,
  lovable_url TEXT,
  github_url TEXT,
  elevator_pitch TEXT,
  demo_video_url TEXT,
  screenshots JSONB,
  category TEXT,
  faculty_mentor TEXT,
  declaration_accepted BOOLEAN,
  declaration_timestamp TIMESTAMPTZ,
  impact_metrics JSONB,
  status TEXT,
  submission_number TEXT,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  score NUMERIC,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user has at least viewer access to this event
  IF NOT has_event_access(target_event_id, 'viewer') THEN
    RAISE EXCEPTION 'Access denied to event submissions';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.cycle_id,
    s.event_id,
    s.user_id,
    s.participation_type,
    s.team_name,
    s.team_members,
    s.senior_learner,
    s.applicant_name,
    s.applicant_email,
    s.applicant_phone,
    i.name AS institution_name,
    i.short_name AS institution_short_name,
    s.department,
    s.year_of_study,
    s.app_name,
    s.problem_statement,
    s.solution_summary,
    s.live_url,
    s.lovable_url,
    s.github_url,
    s.elevator_pitch,
    s.demo_video_url,
    s.screenshots,
    s.category,
    s.faculty_mentor,
    s.declaration_accepted,
    s.declaration_timestamp,
    s.impact_metrics,
    s.status,
    s.submission_number,
    s.review_notes,
    s.reviewed_by,
    s.reviewed_at,
    s.score,
    s.submitted_at,
    s.created_at,
    s.updated_at
  FROM appathon_submissions s
  LEFT JOIN institutions i ON i.id = s.institution_id
  WHERE s.event_id = target_event_id
  ORDER BY
    CASE s.status
      WHEN 'submitted' THEN 1
      WHEN 'under_review' THEN 2
      WHEN 'shortlisted' THEN 3
      WHEN 'winner' THEN 4
      WHEN 'rejected' THEN 5
      WHEN 'draft' THEN 6
    END,
    s.submitted_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Update submission review
-- ============================================

CREATE OR REPLACE FUNCTION update_submission_review(
  submission_id UUID,
  new_status TEXT DEFAULT NULL,
  new_score NUMERIC DEFAULT NULL,
  new_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  target_event_id UUID;
  updated_submission JSONB;
BEGIN
  -- Get the event_id for this submission
  SELECT event_id INTO target_event_id
  FROM appathon_submissions
  WHERE id = submission_id;

  IF target_event_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Submission not found');
  END IF;

  -- Check if user has at least reviewer access
  IF NOT has_event_access(target_event_id, 'reviewer') THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Validate status if provided
  IF new_status IS NOT NULL AND new_status NOT IN ('draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'rejected') THEN
    RETURN jsonb_build_object('error', 'Invalid status');
  END IF;

  -- Validate score if provided (0-5 scale)
  IF new_score IS NOT NULL AND (new_score < 0 OR new_score > 5) THEN
    RETURN jsonb_build_object('error', 'Score must be between 0 and 5');
  END IF;

  -- Update the submission
  UPDATE appathon_submissions
  SET
    status = COALESCE(new_status, status),
    score = COALESCE(new_score, score),
    review_notes = COALESCE(new_review_notes, review_notes),
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = submission_id
  RETURNING to_jsonb(appathon_submissions.*) INTO updated_submission;

  RETURN jsonb_build_object(
    'success', true,
    'submission', updated_submission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_submissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_submission_review(UUID, TEXT, NUMERIC, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_event_submissions IS 'Get all submissions for an event (requires viewer access)';
COMMENT ON FUNCTION update_submission_review IS 'Update submission status/score/notes (requires reviewer access)';
