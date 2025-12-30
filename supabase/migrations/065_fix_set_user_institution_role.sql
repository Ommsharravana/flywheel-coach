-- Migration: Fix set_user_institution function to use 'builder' role
--
-- Problem: The function uses 'learner' in INSERT but migration 056 changed
-- the role constraint to require 'builder' instead of 'learner'.
-- PostgreSQL validates INSERT values BEFORE conflict detection, so even
-- for existing users (UPDATE path), the 'learner' value fails the constraint.
--
-- Error: "new row for relation "users" violates check constraint "users_role_check""
--
-- Fix: Change 'learner' to 'builder' in the INSERT statement

-- Recreate the function with the correct role value
CREATE OR REPLACE FUNCTION set_user_institution(
  p_user_id UUID,
  p_institution_id UUID,
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_institution UUID;
BEGIN
  -- Check if user already has an institution
  SELECT institution_id INTO v_existing_institution
  FROM users
  WHERE id = p_user_id;

  -- If user already has an institution, don't allow change
  IF v_existing_institution IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an institution set';
  END IF;

  -- Upsert the user record with institution
  -- Using 'builder' as default role (changed from 'learner' per migration 056)
  INSERT INTO users (id, email, name, institution_id, role, created_at, updated_at)
  VALUES (
    p_user_id,
    p_email,
    p_name,
    p_institution_id,
    'builder',  -- Fixed: was 'learner' which is not valid per users_role_check constraint
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    institution_id = p_institution_id,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Re-grant execute permissions (in case they were lost)
GRANT EXECUTE ON FUNCTION set_user_institution(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Update comment
COMMENT ON FUNCTION set_user_institution IS 'Sets user institution bypassing RLS - SECURITY DEFINER. Only works if user has no institution. Uses builder as default role.';
