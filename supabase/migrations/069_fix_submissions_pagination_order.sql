-- Fix pagination repeating items bug (BUG-096)
-- Root cause: ORDER BY clause in get_event_submissions lacks deterministic tie-breaker
-- When two submissions have same status and submitted_at, order is non-deterministic
-- causing items to repeat or skip across pagination pages
-- Fix: Add s.id as final ORDER BY column for deterministic ordering

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
    s.submitted_at DESC NULLS LAST,
    s.id ASC;  -- Deterministic tie-breaker to fix pagination
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_event_submissions IS 'Get all submissions for an event with deterministic ordering for pagination';
