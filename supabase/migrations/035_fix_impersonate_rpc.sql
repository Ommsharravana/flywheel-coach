-- Fix impersonation by creating RPC functions that bypass RLS
-- Same issue as other admin routes: auth.uid() returns NULL in server components

-- Get user details for impersonation (superadmin only)
CREATE OR REPLACE FUNCTION get_user_for_impersonation(
  caller_user_id UUID,
  target_user_id UUID
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
) AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if caller is superadmin
  SELECT u.role INTO caller_role
  FROM public.users u
  WHERE u.id = caller_user_id;

  IF caller_role != 'superadmin' THEN
    RETURN;
  END IF;

  -- Return target user details
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.role
  FROM public.users u
  WHERE u.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_for_impersonation(UUID, UUID) TO authenticated;
