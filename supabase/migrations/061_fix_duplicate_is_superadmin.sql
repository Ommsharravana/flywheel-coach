-- Fix duplicate is_superadmin() functions causing ambiguity
-- Drop the old no-param version, keep only the one that accepts optional UUID

-- First drop the old version without params
DROP FUNCTION IF EXISTS is_superadmin();

-- Recreate with only the UUID version (with default NULL)
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  effective_user_id UUID;
BEGIN
  -- Use explicit user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(check_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = effective_user_id
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_superadmin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin(UUID) TO anon;

COMMENT ON FUNCTION is_superadmin IS 'Check if user is superadmin. Uses explicit user_id if provided, otherwise auth.uid()';
