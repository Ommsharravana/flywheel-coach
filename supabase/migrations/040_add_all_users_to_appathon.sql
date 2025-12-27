-- Add all existing users to Appathon 2.0 event
-- This migration:
-- 1. Sets active_event_id for all users to Appathon 2.0
-- 2. Updates get_all_users_admin to include users by active_event_id (not just cycles)

-- =============================================================================
-- STEP 1: Update all users to have Appathon 2.0 as their active event
-- =============================================================================

UPDATE public.users
SET active_event_id = (SELECT id FROM public.events WHERE slug = 'appathon-2' LIMIT 1)
WHERE active_event_id IS NULL
   OR active_event_id != (SELECT id FROM public.events WHERE slug = 'appathon-2' LIMIT 1);

-- Report how many users were updated
DO $$
DECLARE
  appathon_id UUID;
  updated_count INT;
BEGIN
  SELECT id INTO appathon_id FROM public.events WHERE slug = 'appathon-2' LIMIT 1;

  SELECT COUNT(*) INTO updated_count
  FROM public.users
  WHERE active_event_id = appathon_id;

  RAISE NOTICE 'Total users now in Appathon 2.0: %', updated_count;
END $$;


-- =============================================================================
-- STEP 2: Update get_all_users_admin to include users by active_event_id
-- =============================================================================

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

  -- Event admin sees users who:
  -- 1. Have cycles in their events, OR
  -- 2. Have active_event_id set to one of their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT DISTINCT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    WHERE
      -- Users with cycles in admin's events
      u.id IN (
        SELECT DISTINCT c.user_id
        FROM public.cycles c
        WHERE c.event_id IN (
          SELECT ea.event_id
          FROM public.event_admins ea
          WHERE ea.user_id = effective_user_id
        )
      )
      OR
      -- Users whose active_event_id matches admin's events
      u.active_event_id IN (
        SELECT ea.event_id
        FROM public.event_admins ea
        WHERE ea.user_id = effective_user_id
      )
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
