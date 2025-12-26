-- Fix admin RPC functions to work with explicit user_id instead of auth.uid()
-- This fixes issues with Next.js server components where auth.uid() may not work reliably

-- =============================================================================
-- FIX: get_all_users_admin - now accepts explicit caller_user_id
-- =============================================================================

-- Drop old function first
DROP FUNCTION IF EXISTS get_all_users_admin();

CREATE OR REPLACE FUNCTION get_all_users_admin(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  institution_id UUID
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all users
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    ORDER BY u.created_at DESC;

  -- Institution admin sees only their institution's users
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    WHERE u.institution_id = calling_user_institution
    ORDER BY u.created_at DESC;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_users_admin(UUID) TO authenticated;


-- =============================================================================
-- NEW: get_all_cycles_admin - fetches cycles with admin permissions
-- =============================================================================

CREATE OR REPLACE FUNCTION get_all_cycles_admin(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  status TEXT,
  current_step INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  event_id UUID,
  user_name TEXT,
  user_email TEXT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all cycles
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.status,
      c.current_step,
      c.created_at,
      c.updated_at,
      c.user_id,
      c.event_id,
      u.name as user_name,
      u.email as user_email
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    ORDER BY c.updated_at DESC;

  -- Event admin sees cycles from their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.status,
      c.current_step,
      c.created_at,
      c.updated_at,
      c.user_id,
      c.event_id,
      u.name as user_name,
      u.email as user_email
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    WHERE c.event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    )
    ORDER BY c.updated_at DESC;

  -- Institution admin sees cycles from their institution's users
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.status,
      c.current_step,
      c.created_at,
      c.updated_at,
      c.user_id,
      c.event_id,
      u.name as user_name,
      u.email as user_email
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    WHERE u.institution_id = calling_user_institution
    ORDER BY c.updated_at DESC;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_cycles_admin(UUID) TO authenticated;


-- =============================================================================
-- FIX: is_superadmin - also accept optional user_id for explicit checks
-- =============================================================================

CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  effective_user_id UUID;
BEGIN
  effective_user_id := COALESCE(check_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Direct query without going through RLS
  SELECT role INTO user_role
  FROM public.users
  WHERE id = effective_user_id
  LIMIT 1;

  RETURN user_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep both signatures available
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin(UUID) TO authenticated;
