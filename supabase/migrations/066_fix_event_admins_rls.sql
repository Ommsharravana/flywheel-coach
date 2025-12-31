-- Migration: Fix event_admins RLS policies
--
-- Problems Fixed:
-- 1. SELECT: is_event_admin() only checks for role='admin', so reviewers/viewers
--    can't see other event admins for their events
-- 2. INSERT: Only superadmins could insert, but event admins with 'admin' role
--    should also be able to add admins to their events
--
-- Solution:
-- 1. Create has_any_event_role() for SELECT - checks if user has ANY role for event
-- 2. Update INSERT policy to allow event admins with 'admin' role

-- ============================================
-- 1. HELPER FUNCTION: has_any_event_role
-- ============================================

-- Check if current user has ANY role for a specific event (admin, reviewer, or viewer)
CREATE OR REPLACE FUNCTION has_any_event_role(target_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superadmins have access to all events
  IF is_superadmin() THEN
    RETURN true;
  END IF;

  -- Check if user has any role for this event
  RETURN EXISTS (
    SELECT 1 FROM event_admins
    WHERE event_id = target_event_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_any_event_role(UUID) TO authenticated;

COMMENT ON FUNCTION has_any_event_role IS 'Check if user has ANY role (admin/reviewer/viewer) for an event. Used for viewing event_admins list.';

-- ============================================
-- 2. UPDATE SELECT POLICY
-- ============================================

-- Drop the old policy that used is_event_admin (which only checked for admin role)
DROP POLICY IF EXISTS "Event admins can view own event admins" ON event_admins;

-- Create new policy using has_any_event_role (checks for any role)
CREATE POLICY "Event admins can view own event admins"
  ON event_admins FOR SELECT
  USING (has_any_event_role(event_id));

-- ============================================
-- 3. UPDATE INSERT POLICY
-- ============================================

-- Drop the old superadmin-only insert policy
DROP POLICY IF EXISTS "Superadmins can insert event admins" ON event_admins;

-- Create new policy: superadmins OR event admins with 'admin' role can insert
CREATE POLICY "Admins can insert event admins"
  ON event_admins FOR INSERT
  WITH CHECK (
    is_superadmin() OR
    is_event_admin(event_id)  -- is_event_admin checks for role='admin'
  );

-- ============================================
-- 4. UPDATE DELETE POLICY (also allow event admins)
-- ============================================

-- Drop the old superadmin-only delete policy
DROP POLICY IF EXISTS "Superadmins can delete event admins" ON event_admins;

-- Create new policy: superadmins OR event admins with 'admin' role can delete
CREATE POLICY "Admins can delete event admins"
  ON event_admins FOR DELETE
  USING (
    is_superadmin() OR
    is_event_admin(event_id)
  );

-- ============================================
-- 5. UPDATE UPDATE POLICY (also allow event admins)
-- ============================================

-- Drop the old superadmin-only update policy
DROP POLICY IF EXISTS "Superadmins can update event admins" ON event_admins;

-- Create new policy: superadmins OR event admins with 'admin' role can update
CREATE POLICY "Admins can update event admins"
  ON event_admins FOR UPDATE
  USING (
    is_superadmin() OR
    is_event_admin(event_id)
  );
