-- Migration: Fix Senior Learner Stats RPC for Mixed Data Formats
-- Purpose: Handle senior_learner stored as JSONB array OR single object
--
-- The senior_learner column can contain either:
-- 1. Array format: [{ id, name, email, role, ... }, ...]
-- 2. Single object format (legacy): { id, name, email, role, ... }
--
-- This function handles BOTH formats using UNION ALL
-- Now joins with users table to get institution info

CREATE OR REPLACE FUNCTION get_senior_learner_stats(
  target_event_id UUID
)
RETURNS TABLE (
  senior_learner_id UUID,
  senior_learner_name TEXT,
  senior_learner_email TEXT,
  institution_name TEXT,
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
      u.institution AS sl_institution,  -- Get institution from users table
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
  GROUP BY slt.sl_id, slt.sl_name, slt.sl_email, slt.sl_institution
  ORDER BY team_count DESC, slt.sl_name;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_senior_learner_stats IS
'Get aggregated statistics for Senior Learners mentoring teams in a specific event.
Returns each Senior Learner with their team count and team details.
Handles both JSONB array and single object formats for backward compatibility.';
