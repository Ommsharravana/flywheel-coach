-- Migration: Fix is_superadmin function ambiguity in has_event_access_explicit
-- Problem: Two versions of is_superadmin exist (0-arg and 1-arg), causing PostgreSQL
--          function resolution error when called with a parameter
-- Solution: Inline the superadmin check instead of calling the ambiguous function

CREATE OR REPLACE FUNCTION has_event_access_explicit(
  target_event_id UUID,
  check_user_id UUID,
  required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['admin', 'reviewer', 'viewer'];
  user_level INT;
  required_level INT;
  is_super BOOLEAN;
BEGIN
  -- Validate inputs
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is superadmin (inlined to avoid is_superadmin ambiguity)
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = check_user_id AND role = 'superadmin'
  ) INTO is_super;

  IF is_super THEN
    RETURN true;
  END IF;

  -- Check event_admins for the user's role
  SELECT role INTO user_role
  FROM event_admins
  WHERE event_id = target_event_id AND user_id = check_user_id;

  -- If no role found, user has no access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check role hierarchy
  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  -- User has access if their level is <= required level (lower = more access)
  RETURN user_level <= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON FUNCTION has_event_access_explicit(UUID, UUID, TEXT) IS
  'Check if a user has access to an event with the required role.
   Uses inlined superadmin check to avoid is_superadmin function ambiguity.
   Fixed 2025-12-30.';
