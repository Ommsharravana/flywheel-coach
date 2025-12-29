-- Migration: Separate Senior Learner Classification from User Role
--
-- Problem: senior_learner was added as a role value (migration 045), but it's
-- actually a CLASSIFICATION (faculty/staff who mentor teams), not a PERMISSION level.
-- This caused issues like: Director set role='senior_learner', lost admin access.
--
-- Solution:
-- 1. Add is_senior_learner boolean column for classification
-- 2. Migrate existing senior_learner role users
-- 3. Remove senior_learner from role CHECK constraint
-- 4. Update search function to filter by is_senior_learner

-- Step 1: Add is_senior_learner column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_senior_learner BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN users.is_senior_learner IS 'Whether user is a Senior Learner (faculty/staff mentor). This is a CLASSIFICATION, not a role/permission.';

-- Step 2: Migrate existing users with role='senior_learner'
-- Set is_senior_learner = true, then set role = 'learner' (or keep facilitator if they had it before)
UPDATE users
SET
  is_senior_learner = true,
  role = 'learner'  -- Default to learner permission level
WHERE role = 'senior_learner';

-- Step 3: Drop old constraint and create new one WITHOUT senior_learner
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'facilitator', 'admin', 'event_admin', 'institution_admin', 'superadmin'));

-- Update comment on role column
COMMENT ON COLUMN users.role IS 'User permission level: learner (default), facilitator, admin, event_admin, institution_admin, superadmin. Note: senior_learner is now a separate is_senior_learner flag.';

-- Step 4: Update search_users_for_team function to support is_senior_learner filter
CREATE OR REPLACE FUNCTION search_users_for_team(
  search_query TEXT DEFAULT '',
  role_filter TEXT DEFAULT NULL,
  event_id_filter UUID DEFAULT NULL,
  result_limit INT DEFAULT 20,
  senior_learner_only BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  institution TEXT,
  is_senior_learner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    COALESCE(u.name, 'Unknown') as name,
    u.email,
    u.role,
    i.name as institution,
    COALESCE(u.is_senior_learner, false) as is_senior_learner
  FROM users u
  LEFT JOIN institutions i ON u.institution_id = i.id
  WHERE
    -- Search by name or email (case-insensitive partial match)
    (
      search_query = ''
      OR u.name ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    )
    -- Optional role filter (for permissions)
    AND (role_filter IS NULL OR u.role = role_filter)
    -- Optional senior learner filter (for classification)
    AND (senior_learner_only IS NULL OR u.is_senior_learner = senior_learner_only)
    -- Optional event filter (users in the same event)
    AND (event_id_filter IS NULL OR u.active_event_id = event_id_filter)
  ORDER BY u.name ASC
  LIMIT result_limit;
END;
$$;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION search_users_for_team TO authenticated;

-- Update comment
COMMENT ON FUNCTION search_users_for_team IS 'Search users for team member selection. Supports filtering by role (permission) and/or is_senior_learner (classification).';

-- Create index for faster senior learner lookups
CREATE INDEX IF NOT EXISTS idx_users_is_senior_learner ON users (is_senior_learner) WHERE is_senior_learner = true;
