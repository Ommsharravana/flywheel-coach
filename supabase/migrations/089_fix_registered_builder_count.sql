-- Migration: Fix registered builder count to include ALL registered users
--
-- The previous version only counted users from cycles.
-- This version uses a UNION to count:
-- 1. Users who currently have this event as active_event_id
-- 2. Users who have cycles for this event (even if they switched events)
--
-- This ensures we count everyone who ever joined the event

CREATE OR REPLACE FUNCTION get_event_registered_builder_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM (
    -- Currently active users for this event
    SELECT id FROM users WHERE active_event_id = p_event_id
    UNION
    -- Users who created cycles for this event (even if now on different event)
    SELECT user_id FROM cycles WHERE event_id = p_event_id
  ) combined_users;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_all_event_registered_builder_counts()
RETURNS TABLE(
  event_id UUID,
  builder_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    (
      SELECT COUNT(*)::INTEGER
      FROM (
        SELECT u.id FROM users u WHERE u.active_event_id = e.id
        UNION
        SELECT c.user_id FROM cycles c WHERE c.event_id = e.id
      ) combined
    ) as builder_count
  FROM events e
  WHERE e.is_active = true;
END;
$$;
