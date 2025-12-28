-- Migration: Add search_users_for_team function
-- Purpose: Allow authenticated users to search for team members by name or email
-- This function bypasses RLS to enable user search for team formation

CREATE OR REPLACE FUNCTION search_users_for_team(
  search_query TEXT DEFAULT '',
  role_filter TEXT DEFAULT NULL,
  event_id_filter UUID DEFAULT NULL,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  institution TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    COALESCE(u.name, 'Unknown') as name,
    u.email,
    u.role,
    i.name as institution
  FROM users u
  LEFT JOIN institutions i ON u.institution_id = i.id
  WHERE
    -- Search by name or email (case-insensitive partial match)
    (
      search_query = ''
      OR u.name ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    )
    -- Optional role filter
    AND (role_filter IS NULL OR u.role = role_filter)
    -- Optional event filter (users in the same event)
    AND (event_id_filter IS NULL OR u.active_event_id = event_id_filter)
  ORDER BY u.name ASC
  LIMIT result_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users_for_team TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_users_for_team IS 'Search users for team member selection. Allows authenticated users to find potential team members by name or email.';
