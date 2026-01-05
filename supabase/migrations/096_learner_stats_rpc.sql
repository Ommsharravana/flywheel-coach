-- Migration: Learner Stats RPC
-- Purpose: Get aggregated stats for Learners (team members) participating in teams
--
-- The team_members column stores an array of objects:
-- [{ id, name, email }, ...]
-- These are the regular team members (learners), separate from senior_learner column
--
-- This function extracts all team members, joins with users table for institution,
-- and aggregates their team participation

CREATE OR REPLACE FUNCTION get_learner_stats(
  target_event_id UUID
)
RETURNS TABLE (
  learner_id UUID,
  learner_name TEXT,
  learner_email TEXT,
  learner_role TEXT,
  institution_name TEXT,
  team_count BIGINT,
  teams JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH normalized_learners AS (
    -- Handle ARRAY format (standard)
    SELECT
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number,
      member_elem
    FROM appathon_submissions s,
         jsonb_array_elements(s.team_members) AS member_elem
    WHERE s.event_id = target_event_id
      AND s.team_members IS NOT NULL
      AND jsonb_typeof(s.team_members) = 'array'
      AND jsonb_array_length(s.team_members) > 0

    UNION ALL

    -- Handle single OBJECT format (if any legacy data)
    SELECT
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number,
      s.team_members AS member_elem
    FROM appathon_submissions s
    WHERE s.event_id = target_event_id
      AND s.team_members IS NOT NULL
      AND jsonb_typeof(s.team_members) = 'object'
  ),
  learner_teams AS (
    SELECT
      (nl.member_elem->>'id')::UUID AS l_id,
      nl.member_elem->>'name' AS l_name,
      nl.member_elem->>'email' AS l_email,
      u.role AS l_role,  -- Get role from users table
      u.institution AS l_institution,  -- Get institution from users table
      nl.submission_id,
      nl.team_name,
      nl.app_name,
      nl.status,
      nl.submission_number
    FROM normalized_learners nl
    LEFT JOIN users u ON u.id = (nl.member_elem->>'id')::UUID
    WHERE nl.member_elem->>'id' IS NOT NULL
  )
  SELECT
    lt.l_id AS learner_id,
    lt.l_name AS learner_name,
    lt.l_email AS learner_email,
    lt.l_role AS learner_role,
    lt.l_institution AS institution_name,
    COUNT(DISTINCT lt.submission_id)::BIGINT AS team_count,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', lt.submission_id,
        'team_name', lt.team_name,
        'app_name', lt.app_name,
        'status', lt.status,
        'submission_number', lt.submission_number
      )
    ) AS teams
  FROM learner_teams lt
  GROUP BY lt.l_id, lt.l_name, lt.l_email, lt.l_role, lt.l_institution
  ORDER BY team_count DESC, lt.l_name;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_learner_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_learner_stats(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_learner_stats IS
'Get aggregated statistics for Learners participating in teams for a specific event.
Returns each Learner with their team count, role, and team details.
Handles both JSONB array and single object formats for team_members column.';
