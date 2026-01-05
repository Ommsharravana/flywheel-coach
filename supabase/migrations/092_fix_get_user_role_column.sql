-- Fix get_user_role function: column is 'institution' not 'institution_id'
-- The original migration 019 referenced institution_id which doesn't exist

DROP FUNCTION IF EXISTS get_user_role(UUID);

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TABLE(role TEXT, institution TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.role, u.institution
  FROM public.users u
  WHERE u.id = get_user_role.user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- Also ensure check_superadmin exists and works
CREATE OR REPLACE FUNCTION check_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = check_superadmin.user_id;

  RETURN user_role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_superadmin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_superadmin(UUID) TO anon;
