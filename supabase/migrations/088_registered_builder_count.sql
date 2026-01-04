-- Migration: Add RPC function to count ALL registered builders for an event
--
-- Problem: The existing get_event_builder_count uses active_event_id which only
-- counts users whose CURRENT event is the target event. When users switch events,
-- they're no longer counted for their previous event.
--
-- Solution: Count unique users from the cycles table where event_id matches.
-- Since cycles.event_id is required and persists, this gives us ALL users
-- who ever started a cycle for the event - the true "registered builders" count.
--
-- Expected result: Appathon 2.0 should show ~1500-2000 builders instead of ~1337

-- ============================================
-- CREATE NEW FUNCTION: get_event_registered_builder_count
-- ============================================

CREATE OR REPLACE FUNCTION get_event_registered_builder_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count ALL registered builders using UNION:
  -- 1. Users who currently have this event as active (registered and active)
  -- 2. Users who have cycles for this event (participated at some point)
  -- This ensures we count everyone who ever joined the event
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM (
    -- Currently active users
    SELECT id FROM users WHERE active_event_id = p_event_id
    UNION
    -- Users who created cycles for this event (even if now on different event)
    SELECT user_id FROM cycles WHERE event_id = p_event_id
  ) combined_users;

  RETURN v_count;
END;
$$;

-- ============================================
-- CREATE FUNCTION: get_all_event_registered_builder_counts
-- ============================================

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

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_event_registered_builder_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_event_registered_builder_counts() TO authenticated;

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON FUNCTION get_event_registered_builder_count IS
  'Gets count of ALL registered builders for an event by counting unique users from cycles.
   This persists even when users switch events, unlike active_event_id which only tracks current event.';

COMMENT ON FUNCTION get_all_event_registered_builder_counts IS
  'Gets registered builder counts for all active events. Uses cycles table to track historical registrations.';
