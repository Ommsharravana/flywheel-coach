-- RPC to get current user's role
-- Bypasses RLS so users can check their own role for authorization

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  RETURN user_role;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
