-- Fix BUG-213: Create missing get_my_mentoring_stats RPC function
-- This function was part of migration 098 but wasn't applied to production
-- UPDATED: Add optional target_user_id parameter to support impersonation

-- Drop existing function if it exists (to avoid "function name not unique" error)
DROP FUNCTION IF EXISTS get_my_mentoring_stats();
DROP FUNCTION IF EXISTS get_my_mentoring_stats(UUID);

CREATE OR REPLACE FUNCTION get_my_mentoring_stats(target_user_id UUID DEFAULT NULL)
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
  current_user_id UUID;
BEGIN
  -- Use provided target_user_id if given (for impersonation support),
  -- otherwise use auth.uid() (for normal use)
  current_user_id := COALESCE(target_user_id, auth.uid());

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

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_my_mentoring_stats(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_my_mentoring_stats IS
'Get mentoring statistics for a user across all events.
Accepts optional target_user_id parameter (for impersonation support).
If no parameter provided, uses auth.uid() for current authenticated user.
Returns team count per event and whether they are meeting the 5-team target.
Used for Senior Learner self-dashboard.';
