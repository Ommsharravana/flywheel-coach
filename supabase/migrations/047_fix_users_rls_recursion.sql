-- Migration: Fix RLS infinite recursion on users table
-- Problem: Institution admin policies have subqueries that trigger RLS recursion
-- Solution: Replace inline subqueries with SECURITY DEFINER functions

-- ============================================
-- HELPER FUNCTION TO GET CURRENT USER'S INSTITUTION
-- ============================================

-- This function bypasses RLS to get the current user's institution_id
CREATE OR REPLACE FUNCTION get_current_user_institution_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT institution_id FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FIX INSTITUTION ADMIN POLICIES
-- ============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Institution admins can view institution users" ON users;
DROP POLICY IF EXISTS "Institution admins can update institution users" ON users;

-- Recreate with SECURITY DEFINER function instead of inline subquery
CREATE POLICY "Institution admins can view institution users"
  ON users FOR SELECT
  USING (
    is_institution_admin() AND
    institution_id = get_current_user_institution_id()
  );

CREATE POLICY "Institution admins can update institution users"
  ON users FOR UPDATE
  USING (
    is_institution_admin() AND
    institution_id = get_current_user_institution_id() AND
    role NOT IN ('superadmin')
  )
  WITH CHECK (
    role NOT IN ('superadmin')
  );

-- ============================================
-- ALSO FIX DUPLICATE UPDATE POLICIES
-- ============================================

-- Migration 001 created "Users can update own profile"
-- Migration 046 created "Users can update their own profile"
-- These are redundant. Keep only one clear policy.

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Single clear policy for self-update
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- COMMENT
-- ============================================

COMMENT ON FUNCTION get_current_user_institution_id() IS
  'Bypasses RLS to get current user institution_id, avoiding recursion in policies';
