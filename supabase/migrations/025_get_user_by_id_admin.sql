-- Create function for admin to fetch a single user by ID (bypasses RLS)
-- This ensures superadmin can view/edit any user

CREATE OR REPLACE FUNCTION get_user_by_id_admin(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
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
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.updated_at,
           u.institution_id, u.onboarding_completed, u.language
    FROM public.users u
    WHERE u.id = target_user_id;

  -- Institution admin can only view users in their institution
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.updated_at,
           u.institution_id, u.onboarding_completed, u.language
    FROM public.users u
    WHERE u.id = target_user_id
      AND u.institution_id = calling_user_institution;

  -- Others cannot view other users
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_by_id_admin(UUID) TO authenticated;
