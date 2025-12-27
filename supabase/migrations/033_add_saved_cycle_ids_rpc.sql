-- Add RPC function to get saved cycle IDs from problem_bank
-- This bypasses RLS issues with auth.uid() in server components

CREATE OR REPLACE FUNCTION get_saved_cycle_ids(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(original_cycle_id UUID) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT pb.original_cycle_id
    FROM public.problem_bank pb
    WHERE pb.original_cycle_id IS NOT NULL;

  -- Institution admin sees only their institution's
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT pb.original_cycle_id
    FROM public.problem_bank pb
    WHERE pb.original_cycle_id IS NOT NULL
      AND pb.institution_id = calling_user_institution;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_saved_cycle_ids(UUID) TO authenticated;
