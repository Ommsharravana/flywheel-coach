-- Fix: Sync users.role when adding/removing event admins
-- The event_admins table tracks event-specific admin assignments
-- But the users.role field must also be 'event_admin' for the UI to show the Admin link

-- =============================================================================
-- STEP 1: Update assign_event_admin() to also set user role
-- =============================================================================

CREATE OR REPLACE FUNCTION assign_event_admin(
  p_event_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'admin',
  p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  current_user_role TEXT;
BEGIN
  -- Only superadmins can assign event admins
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can assign event admins';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'reviewer', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, reviewer, or viewer', p_role;
  END IF;

  -- Get user's current role
  SELECT role INTO current_user_role FROM public.users WHERE id = p_user_id;

  -- Insert or update the assignment
  INSERT INTO event_admins (event_id, user_id, role, permissions, assigned_by)
  VALUES (p_event_id, p_user_id, p_role, p_permissions, auth.uid())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    assigned_by = auth.uid(),
    assigned_at = NOW()
  RETURNING id INTO new_id;

  -- Update user's role to event_admin if they're not already a higher-level admin
  -- Role hierarchy: superadmin > institution_admin > event_admin > facilitator > learner
  IF current_user_role NOT IN ('superadmin', 'institution_admin') THEN
    UPDATE public.users
    SET role = 'event_admin'
    WHERE id = p_user_id;
  END IF;

  -- Log the action
  INSERT INTO event_admin_logs (event_id, admin_id, action, entity_type, entity_id, details)
  VALUES (
    p_event_id,
    auth.uid(),
    'assign_admin',
    'user',
    p_user_id,
    jsonb_build_object('role', p_role, 'permissions', p_permissions)
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- STEP 2: Update remove_event_admin() to revert role if no other admin assignments
-- =============================================================================

CREATE OR REPLACE FUNCTION remove_event_admin(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  remaining_admin_count INT;
BEGIN
  -- Only superadmins can remove event admins
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can remove event admins';
  END IF;

  -- Delete the assignment
  DELETE FROM event_admins
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Check if user has any remaining event admin assignments
  SELECT COUNT(*) INTO remaining_admin_count
  FROM event_admins
  WHERE user_id = p_user_id;

  -- If no more admin assignments, revert role to learner (if currently event_admin)
  IF remaining_admin_count = 0 THEN
    UPDATE public.users
    SET role = 'learner'
    WHERE id = p_user_id AND role = 'event_admin';
  END IF;

  -- Log the action
  INSERT INTO event_admin_logs (event_id, admin_id, action, entity_type, entity_id)
  VALUES (p_event_id, auth.uid(), 'remove_admin', 'user', p_user_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- STEP 3: Fix existing event admins - sync their users.role
-- =============================================================================

-- Update all users who are in event_admins but don't have event_admin role
UPDATE public.users u
SET role = 'event_admin'
WHERE u.id IN (
  SELECT DISTINCT ea.user_id
  FROM event_admins ea
)
AND u.role NOT IN ('superadmin', 'institution_admin', 'event_admin');

-- Report how many users were updated
DO $$
DECLARE
  updated_count INT;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.users u
  WHERE u.id IN (SELECT DISTINCT user_id FROM event_admins)
  AND u.role = 'event_admin';

  RAISE NOTICE 'Event admins with correct role: %', updated_count;
END $$;
