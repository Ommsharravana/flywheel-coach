-- Migration: Add user_category parameter to update_user_admin function
-- Purpose: Allow admins to change a user's category (learner/senior_learner)
-- Bug: BUG-139 - "User name not found issue" when adding senior learners
--
-- Root Cause: The update_user_admin function doesn't accept user_category,
-- so there's no way for admins to change a user from 'learner' to 'senior_learner'.
-- When searching for Senior Learners, users without 'senior_learner' category don't appear.

-- Drop existing function to recreate with new parameter
DROP FUNCTION IF EXISTS update_user_admin(UUID, TEXT, TEXT);

-- Recreate function with user_category parameter
CREATE OR REPLACE FUNCTION update_user_admin(
  target_user_id UUID,
  new_name TEXT DEFAULT NULL,
  new_role TEXT DEFAULT NULL,
  new_user_category TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  user_category TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  institution_id UUID
) AS $$
DECLARE
  calling_user_role TEXT;
  target_current_role TEXT;
BEGIN
  -- Get the calling user's role
  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = auth.uid();

  -- Only superadmin can update users
  IF calling_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: Only superadmin can update users';
  END IF;

  -- Get target user's current role
  SELECT u.role INTO target_current_role
  FROM public.users u
  WHERE u.id = target_user_id;

  -- Cannot modify superadmin users
  IF target_current_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot modify superadmin users';
  END IF;

  -- Cannot set role to superadmin
  IF new_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot set superadmin role through this function';
  END IF;

  -- Validate user_category if provided
  IF new_user_category IS NOT NULL AND new_user_category NOT IN ('learner', 'senior_learner') THEN
    RAISE EXCEPTION 'Invalid user_category. Must be "learner" or "senior_learner"';
  END IF;

  -- Perform the update
  UPDATE public.users u
  SET
    name = COALESCE(new_name, u.name),
    role = COALESCE(new_role, u.role),
    user_category = COALESCE(new_user_category, u.user_category),
    updated_at = NOW()
  WHERE u.id = target_user_id;

  -- Return the updated user
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.user_category,
    u.avatar_url,
    u.created_at,
    u.updated_at,
    u.institution_id
  FROM public.users u
  WHERE u.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_admin(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_user_admin IS 'Update user profile as admin. Supports updating name, role, and user_category. Only superadmins can use this function.';

-- Also update get_user_by_id_admin to return user_category
DROP FUNCTION IF EXISTS get_user_by_id_admin(UUID);

CREATE OR REPLACE FUNCTION get_user_by_id_admin(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  user_category TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  institution_id UUID,
  onboarding_completed BOOLEAN,
  language TEXT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
BEGIN
  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = auth.uid();

  -- Superadmin can view any user
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, COALESCE(u.user_category, 'learner') as user_category,
           u.avatar_url, u.created_at, u.updated_at,
           u.institution_id, u.onboarding_completed, u.language
    FROM public.users u
    WHERE u.id = target_user_id;

  -- Institution admin can only view users in their institution
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, COALESCE(u.user_category, 'learner') as user_category,
           u.avatar_url, u.created_at, u.updated_at,
           u.institution_id, u.onboarding_completed, u.language
    FROM public.users u
    WHERE u.id = target_user_id
      AND u.institution_id = calling_user_institution;

  -- Event admin can view users in their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, COALESCE(u.user_category, 'learner') as user_category,
           u.avatar_url, u.created_at, u.updated_at,
           u.institution_id, u.onboarding_completed, u.language
    FROM public.users u
    WHERE u.id = target_user_id;

  -- Others cannot view other users through this function
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_by_id_admin(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_by_id_admin IS 'Get user by ID for admin panel. Returns user_category for determining learner/senior_learner status.';
