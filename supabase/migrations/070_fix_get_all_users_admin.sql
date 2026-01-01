-- Migration: Fix get_all_users_admin to include user_category and support pagination
--
-- Issues fixed:
-- 1. Missing user_category column in return (added in migration 056)
-- 2. No explicit row limit means Supabase uses default 1000
--
-- Solution: Add user_category to return, add optional pagination parameters

-- Drop existing function (both signatures)
DROP FUNCTION IF EXISTS get_all_users_admin();
DROP FUNCTION IF EXISTS get_all_users_admin(UUID);

-- Create updated function with user_category and pagination support
CREATE OR REPLACE FUNCTION get_all_users_admin(
  caller_user_id UUID DEFAULT NULL,
  page_offset INT DEFAULT 0,
  page_limit INT DEFAULT NULL  -- NULL means return all rows
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  user_category TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  institution_id UUID,
  total_count BIGINT
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
    IF page_limit IS NULL THEN
      -- Return all users (no limit)
      RETURN QUERY
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      ORDER BY u.created_at DESC
      OFFSET page_offset;
    ELSE
      -- Return paginated users
      RETURN QUERY
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      ORDER BY u.created_at DESC
      LIMIT page_limit
      OFFSET page_offset;
    END IF;

  -- Event admin sees only users participating in their events
  ELSIF calling_user_role = 'event_admin' THEN
    IF page_limit IS NULL THEN
      RETURN QUERY
      SELECT DISTINCT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      WHERE u.active_event_id IN (
        SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
      )
      ORDER BY u.created_at DESC
      OFFSET page_offset;
    ELSE
      RETURN QUERY
      SELECT DISTINCT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      WHERE u.active_event_id IN (
        SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
      )
      ORDER BY u.created_at DESC
      LIMIT page_limit
      OFFSET page_offset;
    END IF;

  -- Institution admin sees only their institution's users
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    IF page_limit IS NULL THEN
      RETURN QUERY
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      WHERE u.institution_id = calling_user_institution
      ORDER BY u.created_at DESC
      OFFSET page_offset;
    ELSE
      RETURN QUERY
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        COALESCE(u.user_category, 'learner') as user_category,
        u.avatar_url,
        u.created_at,
        u.institution_id,
        COUNT(*) OVER() as total_count
      FROM public.users u
      WHERE u.institution_id = calling_user_institution
      ORDER BY u.created_at DESC
      LIMIT page_limit
      OFFSET page_offset;
    END IF;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_users_admin(UUID, INT, INT) TO authenticated;

COMMENT ON FUNCTION get_all_users_admin IS 'Get all users for admin panel. Returns user_category and supports pagination. Pass page_limit=NULL to get all users.';
