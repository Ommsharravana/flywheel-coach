-- Migration: Add RPC function to get full user profile bypassing RLS
-- This is needed because the dashboard layout needs to read user data
-- but RLS may block the query for some users (e.g., superadmin)

-- Create function to get full user profile
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE(
  role TEXT,
  institution_id UUID,
  active_event_id UUID,
  language TEXT,
  name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.role::TEXT,
    u.institution_id,
    u.active_event_id,
    u.language,
    u.name,
    u.email
  FROM users u
  WHERE u.id = p_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_profile IS 'Gets full user profile bypassing RLS - SECURITY DEFINER';
