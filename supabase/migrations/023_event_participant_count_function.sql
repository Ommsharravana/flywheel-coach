-- Migration: Add RPC function to get event participant counts
-- This bypasses RLS to allow any authenticated user to see participant counts
-- without exposing user details

-- Function to get participant count for a single event
CREATE OR REPLACE FUNCTION get_event_participant_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM users
  WHERE active_event_id = p_event_id;

  RETURN v_count;
END;
$$;

-- Function to get participant counts for all active events (more efficient for listing)
CREATE OR REPLACE FUNCTION get_all_event_participant_counts()
RETURNS TABLE(
  event_id UUID,
  participant_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    COUNT(u.id)::INTEGER as participant_count
  FROM events e
  LEFT JOIN users u ON u.active_event_id = e.id
  WHERE e.is_active = true
  GROUP BY e.id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_event_participant_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_event_participant_counts() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_event_participant_count IS 'Gets participant count for a single event - SECURITY DEFINER bypasses RLS';
COMMENT ON FUNCTION get_all_event_participant_counts IS 'Gets participant counts for all active events - SECURITY DEFINER bypasses RLS';
