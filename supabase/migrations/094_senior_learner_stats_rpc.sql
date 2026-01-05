-- Migration: Senior Learner Stats RPC
-- Purpose: Get aggregated stats for Senior Learners mentoring teams in an event
--
-- This function aggregates the senior_learner JSONB column from appathon_submissions
-- to show how many teams each Senior Learner is mentoring.

CREATE OR REPLACE FUNCTION get_senior_learner_stats(
  target_event_id UUID
)
RETURNS TABLE (
  senior_learner_id UUID,
  senior_learner_name TEXT,
  senior_learner_email TEXT,
  institution_id UUID,
  team_count BIGINT,
  teams JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH senior_learner_teams AS (
    SELECT
      (s.senior_learner->>'id')::UUID AS sl_id,
      s.senior_learner->>'name' AS sl_name,
      s.senior_learner->>'email' AS sl_email,
      (s.senior_learner->>'institution_id')::UUID AS sl_institution_id,
      s.id AS submission_id,
      s.team_name,
      s.app_name,
      s.status,
      s.submission_number
    FROM appathon_submissions s
    WHERE s.event_id = target_event_id
      AND s.senior_learner IS NOT NULL
      AND s.senior_learner->>'id' IS NOT NULL
  )
  SELECT
    slt.sl_id AS senior_learner_id,
    slt.sl_name AS senior_learner_name,
    slt.sl_email AS senior_learner_email,
    slt.sl_institution_id AS institution_id,
    COUNT(*)::BIGINT AS team_count,
    jsonb_agg(
      jsonb_build_object(
        'id', slt.submission_id,
        'team_name', slt.team_name,
        'app_name', slt.app_name,
        'status', slt.status,
        'submission_number', slt.submission_number
      )
      ORDER BY slt.team_name
    ) AS teams
  FROM senior_learner_teams slt
  GROUP BY slt.sl_id, slt.sl_name, slt.sl_email, slt.sl_institution_id
  ORDER BY team_count DESC, slt.sl_name;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_senior_learner_stats(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_senior_learner_stats IS
'Get aggregated statistics for Senior Learners mentoring teams in a specific event.
Returns each Senior Learner with their team count and team details.';
