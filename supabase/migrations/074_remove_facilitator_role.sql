-- Migration: Remove unused 'facilitator' role
--
-- Why:
-- 1. 'facilitator' role is not used anywhere in the codebase
-- 2. JKKN uses 'senior_learner' as identity (already in user_category column)
-- 3. Clean up legacy role that adds confusion
--
-- Current state (from migration 056):
-- - user_category: 'learner' (student), 'senior_learner' (faculty) ← JKKN identity
-- - role: 'builder', 'facilitator', 'admin', 'event_admin', 'institution_admin', 'superadmin'
--
-- After this migration:
-- - role: 'builder', 'admin', 'event_admin', 'institution_admin', 'superadmin'
-- - 'facilitator' removed (was never used)

-- Step 1: Update any users with 'facilitator' role to 'builder' (defensive - should be 0 users)
UPDATE users SET role = 'builder' WHERE role = 'facilitator';

-- Step 2: Drop the existing constraint (must match exact name from migration 056)
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Step 3: Add new constraint WITHOUT 'facilitator'
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('builder', 'admin', 'event_admin', 'institution_admin', 'superadmin'));

-- Step 4: Update comments to clarify JKKN terminology
COMMENT ON COLUMN users.role IS 'Permission level: builder (default), admin, event_admin, institution_admin, superadmin. User identity (learner/senior_learner) is in user_category column.';
COMMENT ON COLUMN users.user_category IS 'JKKN identity: learner (student) or senior_learner (faculty/staff)';
