-- Migration: Properly Separate User Category (Identity) from Role (Permissions)
--
-- Problem: The role field mixes identity ('learner') with permissions ('admin', 'event_admin').
-- This is confusing - "learner role" sounds like a category, not a permission level.
--
-- Solution:
-- 1. Add user_category column: 'learner' (student) | 'senior_learner' (faculty)
-- 2. Rename role='learner' to role='builder' (aspirational default permission)
-- 3. Migrate is_senior_learner boolean to user_category
-- 4. Drop is_senior_learner column (now redundant)
--
-- Why 'builder'?
-- - Aspirational: "You're a builder" empowers users from day one
-- - Solution-focused: Aligns with JKKN Solution Studio - where you build solutions
-- - Clean: Short, database-friendly, parallel to other roles
--
-- After this migration:
-- - user_category = WHO you are (learner = student, senior_learner = faculty/staff)
-- - role = WHAT you can do (builder = default, facilitator, event_admin, institution_admin, superadmin)

-- Step 1: Add user_category column with default 'learner'
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_category TEXT DEFAULT 'learner';

-- Step 2: Migrate is_senior_learner boolean to user_category
UPDATE users
SET user_category = 'senior_learner'
WHERE is_senior_learner = true;

-- Step 3: Add CHECK constraint for user_category
ALTER TABLE users ADD CONSTRAINT users_category_check
  CHECK (user_category IN ('learner', 'senior_learner'));

-- Step 4: FIRST drop old role constraint to allow data migration
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 5: NOW update role values - change 'learner' to 'builder'
UPDATE users SET role = 'builder' WHERE role = 'learner';

-- Step 6: Add new role constraint with 'builder' instead of 'learner'
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('builder', 'facilitator', 'admin', 'event_admin', 'institution_admin', 'superadmin'));

-- Step 7: Drop is_senior_learner column (now redundant)
ALTER TABLE users DROP COLUMN IF EXISTS is_senior_learner;

-- Step 8: Update search_users_for_team function to use user_category instead of is_senior_learner
DROP FUNCTION IF EXISTS search_users_for_team(TEXT, TEXT, UUID, INT, BOOLEAN);

CREATE OR REPLACE FUNCTION search_users_for_team(
  search_query TEXT DEFAULT '',
  role_filter TEXT DEFAULT NULL,
  event_id_filter UUID DEFAULT NULL,
  result_limit INT DEFAULT 20,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  user_category TEXT,
  institution TEXT
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
    COALESCE(u.user_category, 'learner') as user_category,
    i.name as institution
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
    -- Optional category filter (for identity - learner/senior_learner)
    AND (category_filter IS NULL OR u.user_category = category_filter)
    -- Optional event filter (users in the same event)
    AND (event_id_filter IS NULL OR u.active_event_id = event_id_filter)
  ORDER BY u.name ASC
  LIMIT result_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_users_for_team TO authenticated;

-- Update comments
COMMENT ON COLUMN users.user_category IS 'User identity category: learner (student) or senior_learner (faculty/staff mentor)';
COMMENT ON COLUMN users.role IS 'User permission level: builder (default), facilitator, admin, event_admin, institution_admin, superadmin';
COMMENT ON FUNCTION search_users_for_team IS 'Search users for team member selection. Supports filtering by role (permission) and/or user_category (identity).';

-- Create index for faster category lookups
DROP INDEX IF EXISTS idx_users_is_senior_learner;
CREATE INDEX IF NOT EXISTS idx_users_category ON users (user_category);
