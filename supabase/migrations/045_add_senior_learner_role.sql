-- Migration: Add senior_learner role to users table
-- Purpose: Allow users to self-identify as Senior Learners for Appathon team formation
-- Senior Learners are experienced users who mentor teams through the flywheel process

-- Drop the existing CHECK constraint on role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint that includes senior_learner
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'senior_learner', 'facilitator', 'admin', 'event_admin', 'institution_admin', 'superadmin'));

-- Add comment explaining the role
COMMENT ON COLUMN users.role IS 'User role: learner (default), senior_learner (mentor/guide for teams), facilitator, admin, event_admin, institution_admin, superadmin';
