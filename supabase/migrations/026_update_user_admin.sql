-- Create function for admin to update a user (bypasses RLS)
-- This ensures superadmin can update any user's role/name

CREATE OR REPLACE FUNCTION update_user_admin(
  target_user_id UUID,
  new_name TEXT DEFAULT NULL,
  new_role TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
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

  -- Perform the update
  UPDATE public.users u
  SET
    name = COALESCE(new_name, u.name),
    role = COALESCE(new_role, u.role),
    updated_at = NOW()
  WHERE u.id = target_user_id;

  -- Return the updated user
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.updated_at, u.institution_id
  FROM public.users u
  WHERE u.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_admin(UUID, TEXT, TEXT) TO authenticated;

-- Also create a function to check if current user is superadmin (for API routes)
CREATE OR REPLACE FUNCTION check_is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN user_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_is_superadmin() TO authenticated;
