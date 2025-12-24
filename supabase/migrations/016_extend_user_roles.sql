-- Extend User Roles Migration
-- Adds event_admin and institution_admin to the allowed user roles
-- Run this after 015_learning_flywheel.sql

-- ============================================
-- UPDATE ROLE CONSTRAINT
-- ============================================

-- Drop the existing constraint (from migration 003)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with all 6 roles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'facilitator', 'admin', 'event_admin', 'institution_admin', 'superadmin'));

-- ============================================
-- HELPER FUNCTIONS FOR ROLE CHECKS
-- ============================================

-- Check if current user is an event_admin
CREATE OR REPLACE FUNCTION is_event_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'event_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is an institution_admin
CREATE OR REPLACE FUNCTION is_institution_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'institution_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is any admin type
CREATE OR REPLACE FUNCTION is_any_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'event_admin', 'institution_admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE ADMIN USER STATS VIEW
-- ============================================

-- Recreate the admin_user_stats view to include new roles
DROP VIEW IF EXISTS admin_user_stats;
CREATE VIEW admin_user_stats AS
SELECT
  role,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
FROM users
GROUP BY role;

GRANT SELECT ON admin_user_stats TO authenticated;

-- ============================================
-- RLS POLICIES FOR INSTITUTION ADMIN
-- ============================================

-- Institution admins can view users in their institution
DROP POLICY IF EXISTS "Institution admins can view institution users" ON users;
CREATE POLICY "Institution admins can view institution users"
  ON users FOR SELECT
  USING (
    is_institution_admin() AND
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
  );

-- Institution admins can update users in their institution (except role changes to superadmin)
DROP POLICY IF EXISTS "Institution admins can update institution users" ON users;
CREATE POLICY "Institution admins can update institution users"
  ON users FOR UPDATE
  USING (
    is_institution_admin() AND
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()) AND
    role NOT IN ('superadmin')
  )
  WITH CHECK (
    role NOT IN ('superadmin')
  );
