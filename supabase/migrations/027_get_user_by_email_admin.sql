-- Function to find user by email for admin purposes (bypasses RLS)
-- Used when adding event admins

CREATE OR REPLACE FUNCTION get_user_by_email_admin(target_email TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
) AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Get the calling user's role
  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = auth.uid();

  -- Only superadmin or event_admin can look up users
  IF calling_user_role NOT IN ('superadmin', 'event_admin', 'institution_admin', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can look up users';
  END IF;

  -- Return user data
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.role
  FROM public.users u
  WHERE LOWER(u.email) = LOWER(target_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_by_email_admin(TEXT) TO authenticated;
