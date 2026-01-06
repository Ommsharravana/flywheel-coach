-- Migration: Senior Learner Accountability
-- Purpose: Add department info to Senior Learner stats + create self-stats RPC
--
-- P06: Senior Learner Accountability Feature
-- - Track that every Senior Learner mentors 5+ teams
-- - Department heads can view their Senior Learners' activity
-- - Senior Learners can see their own mentoring stats

-- ============================================
-- Update get_senior_learner_stats to include department
-- ============================================

-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS get_senior_learner_stats(UUID);

CREATE OR REPLACE FUNCTION get_senior_learner_stats(
  target_event_id UUID
)
RETURNS TABLE (
  senior_learner_id UUID,
  senior_learner_name TEXT,
  senior_learner_email TEXT,
  institution_name TEXT,
  department_name TEXT,
  team_count BIGINT,
  teams JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH normalized_senior_learners AS (
    -- Handle ARRAY format (new data)
    SELECT
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number,
      sl_elem
    FROM appathon_submissions s,
         jsonb_array_elements(s.senior_learner) AS sl_elem
    WHERE s.event_id = target_event_id
      AND s.senior_learner IS NOT NULL
      AND jsonb_typeof(s.senior_learner) = 'array'

    UNION ALL

    -- Handle single OBJECT format (legacy data)
    SELECT
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number,
      s.senior_learner AS sl_elem
    FROM appathon_submissions s
    WHERE s.event_id = target_event_id
      AND s.senior_learner IS NOT NULL
      AND jsonb_typeof(s.senior_learner) = 'object'
  ),
  senior_learner_teams AS (
    SELECT
      (nsl.sl_elem->>'id')::UUID AS sl_id,
      nsl.sl_elem->>'name' AS sl_name,
      nsl.sl_elem->>'email' AS sl_email,
      u.institution AS sl_institution,
      u.department AS sl_department,
      nsl.submission_id,
      nsl.team_name,
      nsl.app_name,
      nsl.status,
      nsl.submission_number
    FROM normalized_senior_learners nsl
    LEFT JOIN users u ON u.id = (nsl.sl_elem->>'id')::UUID
    WHERE nsl.sl_elem->>'id' IS NOT NULL
  )
  SELECT
    slt.sl_id AS senior_learner_id,
    slt.sl_name AS senior_learner_name,
    slt.sl_email AS senior_learner_email,
    slt.sl_institution AS institution_name,
    slt.sl_department AS department_name,
    COUNT(DISTINCT slt.submission_id)::BIGINT AS team_count,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', slt.submission_id,
        'team_name', slt.team_name,
        'app_name', slt.app_name,
        'status', slt.status,
        'submission_number', slt.submission_number
      )
    ) AS teams
  FROM senior_learner_teams slt
  GROUP BY slt.sl_id, slt.sl_name, slt.sl_email, slt.sl_institution, slt.sl_department
  ORDER BY team_count DESC, slt.sl_name;
END;
$$;

-- ============================================
-- Create RPC for Senior Learner's own stats (self-view)
-- ============================================

CREATE OR REPLACE FUNCTION get_my_mentoring_stats()
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  event_slug TEXT,
  team_count BIGINT,
  teams JSONB,
  is_meeting_target BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  WITH my_mentored_teams AS (
    SELECT
      s.event_id,
      e.name AS event_name,
      e.slug AS event_slug,
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number
    FROM appathon_submissions s
    JOIN events e ON e.id = s.event_id
    WHERE s.senior_learner IS NOT NULL
      AND (
        -- Check array format
        (jsonb_typeof(s.senior_learner) = 'array' AND
         EXISTS (
           SELECT 1 FROM jsonb_array_elements(s.senior_learner) elem
           WHERE (elem->>'id')::UUID = current_user_id
         ))
        OR
        -- Check single object format
        (jsonb_typeof(s.senior_learner) = 'object' AND
         (s.senior_learner->>'id')::UUID = current_user_id)
      )
  )
  SELECT
    mt.event_id,
    mt.event_name,
    mt.event_slug,
    COUNT(DISTINCT mt.submission_id)::BIGINT AS team_count,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', mt.submission_id,
        'team_name', mt.team_name,
        'app_name', mt.app_name,
        'status', mt.status,
        'submission_number', mt.submission_number
      )
    ) AS teams,
    (COUNT(DISTINCT mt.submission_id) >= 5) AS is_meeting_target
  FROM my_mentored_teams mt
  GROUP BY mt.event_id, mt.event_name, mt.event_slug
  ORDER BY mt.event_name;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_my_mentoring_stats() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_senior_learner_stats IS
'Get aggregated statistics for Senior Learners mentoring teams in a specific event.
Returns each Senior Learner with their team count, department, and team details.
Handles both JSONB array and single object formats for backward compatibility.';

COMMENT ON FUNCTION get_my_mentoring_stats IS
'Get the current user''s mentoring statistics across all events.
Returns team count per event and whether they are meeting the 5-team target.
Used for Senior Learner self-dashboard.';
