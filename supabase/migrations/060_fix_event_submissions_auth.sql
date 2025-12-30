-- Fix get_event_submissions and related functions to work with explicit user_id
-- This fixes issues with Next.js server components where auth.uid() may not work reliably
-- Same pattern as migration 028 for other admin functions

-- ============================================
-- NEW: has_event_access_explicit - accepts explicit user_id
-- ============================================

CREATE OR REPLACE FUNCTION has_event_access_explicit(
  target_event_id UUID,
  check_user_id UUID,
  required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['admin', 'reviewer', 'viewer'];
  user_level INT;
  required_level INT;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Superadmins have full access (using explicit user ID)
  IF is_superadmin(check_user_id) THEN
    RETURN true;
  END IF;

  -- Get user's role for this event
  SELECT role INTO user_role
  FROM event_admins
  WHERE event_id = target_event_id AND user_id = check_user_id;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Compare role levels (admin > reviewer > viewer)
  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  RETURN user_level <= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_event_access_explicit(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION has_event_access_explicit IS 'Check event access with explicit user_id (for Server Components)';

-- ============================================
-- FIX: get_event_submissions - now accepts caller_user_id
-- ============================================

-- Drop old function first (different signature)
DROP FUNCTION IF EXISTS get_event_submissions(UUID);

CREATE OR REPLACE FUNCTION get_event_submissions(
  target_event_id UUID,
  caller_user_id UUID DEFAULT NULL
)
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
DECLARE
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RAISE EXCEPTION 'No user context available';
  END IF;

  -- Check if user has at least viewer access to this event using explicit user ID
  IF NOT has_event_access_explicit(target_event_id, effective_user_id, 'viewer') THEN
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

GRANT EXECUTE ON FUNCTION get_event_submissions(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_event_submissions IS 'Get all submissions for an event (accepts explicit caller_user_id for Server Components)';

-- ============================================
-- FIX: update_submission_review - now accepts caller_user_id
-- ============================================

-- Drop old function first (different signature)
DROP FUNCTION IF EXISTS update_submission_review(UUID, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION update_submission_review(
  submission_id UUID,
  new_status TEXT DEFAULT NULL,
  new_score NUMERIC DEFAULT NULL,
  new_review_notes TEXT DEFAULT NULL,
  caller_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  target_event_id UUID;
  updated_submission JSONB;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No user context available');
  END IF;

  -- Get the event_id for this submission
  SELECT event_id INTO target_event_id
  FROM appathon_submissions
  WHERE id = submission_id;

  IF target_event_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Submission not found');
  END IF;

  -- Check if user has at least reviewer access using explicit user ID
  IF NOT has_event_access_explicit(target_event_id, effective_user_id, 'reviewer') THEN
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
    reviewed_by = effective_user_id,
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

GRANT EXECUTE ON FUNCTION update_submission_review(UUID, TEXT, NUMERIC, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION update_submission_review IS 'Update submission status/score/notes (accepts explicit caller_user_id for Server Components)';
