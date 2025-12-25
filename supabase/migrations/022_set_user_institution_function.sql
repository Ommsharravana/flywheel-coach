-- Migration: Add RPC function to set user's institution bypassing RLS
-- This is needed because the RLS policies on users table have recursive
-- subqueries that cause infinite recursion when a user tries to update
-- their own institution_id

-- Create function to set institution for a user (first-time setup)
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
  INSERT INTO users (id, email, name, institution_id, role, created_at, updated_at)
  VALUES (
    p_user_id,
    p_email,
    p_name,
    p_institution_id,
    'learner',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    institution_id = p_institution_id,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Create function to get user's institution (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_institution(p_user_id UUID)
RETURNS TABLE(
  institution_id UUID,
  institution_name TEXT,
  institution_short_name TEXT,
  institution_slug TEXT,
  institution_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.institution_id,
    i.name::TEXT,
    i.short_name::TEXT,
    i.slug::TEXT,
    i.type::TEXT
  FROM users u
  LEFT JOIN institutions i ON i.id = u.institution_id
  WHERE u.id = p_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION set_user_institution(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_institution(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION set_user_institution IS 'Sets user institution bypassing RLS - SECURITY DEFINER. Only works if user has no institution.';
COMMENT ON FUNCTION get_user_institution IS 'Gets user institution with details bypassing RLS - SECURITY DEFINER';
