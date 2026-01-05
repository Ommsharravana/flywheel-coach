-- Migration: Add RPC function to get event admins
--
-- Problem: Direct queries to event_admins table fail RLS because:
-- 1. is_superadmin() uses auth.uid() which is NULL in server-side context
-- 2. has_any_event_role() also uses auth.uid()
--
-- Solution: Create SECURITY DEFINER function that takes user_id as parameter
-- and validates access manually (like get_user_role does)

-- ============================================
-- GET EVENT ADMINS RPC
-- ============================================

CREATE OR REPLACE FUNCTION get_event_admins(
  p_event_id UUID,
  p_requesting_user_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT
) AS $$
DECLARE
  user_role TEXT;
  is_event_admin_user BOOLEAN;
BEGIN
  -- Check if requesting user is superadmin
  SELECT u.role INTO user_role
  FROM public.users u
  WHERE u.id = p_requesting_user_id;

  -- If superadmin, return all admins for this event
  IF user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      ea.id,
      ea.user_id,
      ea.role,
      ea.assigned_at as created_at,
      u.name as user_name,
      u.email as user_email
    FROM event_admins ea
    LEFT JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = p_event_id
    ORDER BY ea.assigned_at ASC;
    RETURN;
  END IF;

  -- Check if requesting user is an admin of this event
  SELECT EXISTS (
    SELECT 1 FROM event_admins
    WHERE event_id = p_event_id
    AND user_id = p_requesting_user_id
  ) INTO is_event_admin_user;

  -- If event admin, return all admins for this event
  IF is_event_admin_user THEN
    RETURN QUERY
    SELECT
      ea.id,
      ea.user_id,
      ea.role,
      ea.assigned_at as created_at,
      u.name as user_name,
      u.email as user_email
    FROM event_admins ea
    LEFT JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = p_event_id
    ORDER BY ea.assigned_at ASC;
    RETURN;
  END IF;

  -- User is not authorized - return empty
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_event_admins(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_admins(UUID, UUID) TO anon;

COMMENT ON FUNCTION get_event_admins IS 'Get event admins with user details, bypassing RLS. Validates access using p_requesting_user_id parameter.';
