-- Create a function to get user role bypassing RLS
-- This is needed because the auth callback and middleware need to check role
-- before RLS policies can properly evaluate

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TABLE(role TEXT, institution_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT u.role, u.institution_id
  FROM public.users u
  WHERE u.id = user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- Also create a simpler function specifically for superadmin check
CREATE OR REPLACE FUNCTION check_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN user_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_superadmin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_superadmin(UUID) TO anon;

-- Verify current state of director@jkkn.ac.in
DO $$
DECLARE
  user_id UUID;
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Get from auth.users
  SELECT id, email INTO user_id, user_email
  FROM auth.users
  WHERE email = 'director@jkkn.ac.in';

  IF user_id IS NOT NULL THEN
    -- Get role from public.users
    SELECT role INTO user_role
    FROM public.users
    WHERE id = user_id;

    RAISE NOTICE 'Auth user: id=%, email=%', user_id, user_email;
    RAISE NOTICE 'Public user role: %', COALESCE(user_role, 'NOT FOUND');

    -- If role is not superadmin, set it
    IF user_role IS NULL OR user_role != 'superadmin' THEN
      UPDATE public.users SET role = 'superadmin' WHERE id = user_id;
      RAISE NOTICE 'Updated role to superadmin';
    ELSE
      RAISE NOTICE 'Role is already superadmin';
    END IF;
  ELSE
    RAISE NOTICE 'User director@jkkn.ac.in not found in auth.users';
  END IF;
END $$;
