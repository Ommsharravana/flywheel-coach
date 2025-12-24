-- Event Admins Migration
-- Adds event-specific admin roles for multi-initiative architecture
-- Run this after 010_problem_bank_fixes.sql

-- ============================================
-- EVENT ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'reviewer', 'viewer')),

  -- Granular permissions (optional, for fine-tuned access)
  permissions JSONB DEFAULT '{}'::jsonb,
  -- Example: {"can_edit_settings": true, "can_review_submissions": true}

  -- Audit trail
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(event_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_event_admins_event ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user ON event_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_role ON event_admins(role);

-- ============================================
-- RLS HELPER FUNCTIONS
-- ============================================

-- Check if current user is admin of a specific event
CREATE OR REPLACE FUNCTION is_event_admin(target_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superadmins are implicitly admins of all events
  IF is_superadmin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM event_admins
    WHERE event_id = target_event_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has any admin role for an event (admin, reviewer, or viewer)
CREATE OR REPLACE FUNCTION has_event_access(target_event_id UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['admin', 'reviewer', 'viewer'];
  user_level INT;
  required_level INT;
BEGIN
  -- Superadmins have full access
  IF is_superadmin() THEN
    RETURN true;
  END IF;

  -- Get user's role for this event
  SELECT role INTO user_role
  FROM event_admins
  WHERE event_id = target_event_id AND user_id = auth.uid();

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Compare role levels (admin > reviewer > viewer)
  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  RETURN user_level <= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all events where current user is an admin
CREATE OR REPLACE FUNCTION get_admin_events()
RETURNS TABLE(event_id UUID, event_name TEXT, event_slug TEXT, admin_role TEXT) AS $$
BEGIN
  -- If superadmin, return all events
  IF is_superadmin() THEN
    RETURN QUERY
    SELECT e.id, e.name, e.slug, 'superadmin'::TEXT
    FROM events e
    WHERE e.is_active = true;
  ELSE
    RETURN QUERY
    SELECT e.id, e.name, e.slug, ea.role
    FROM events e
    JOIN event_admins ea ON ea.event_id = e.id
    WHERE ea.user_id = auth.uid()
    AND e.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS FOR EVENT_ADMINS TABLE
-- ============================================

ALTER TABLE event_admins ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all event admin assignments
DROP POLICY IF EXISTS "Superadmins can view all event admins" ON event_admins;
CREATE POLICY "Superadmins can view all event admins"
  ON event_admins FOR SELECT
  USING (is_superadmin());

-- Event admins can view their own event's admin list
DROP POLICY IF EXISTS "Event admins can view own event admins" ON event_admins;
CREATE POLICY "Event admins can view own event admins"
  ON event_admins FOR SELECT
  USING (is_event_admin(event_id));

-- Users can view their own admin assignments
DROP POLICY IF EXISTS "Users can view own admin assignments" ON event_admins;
CREATE POLICY "Users can view own admin assignments"
  ON event_admins FOR SELECT
  USING (user_id = auth.uid());

-- Only superadmins can assign event admins
DROP POLICY IF EXISTS "Superadmins can insert event admins" ON event_admins;
CREATE POLICY "Superadmins can insert event admins"
  ON event_admins FOR INSERT
  WITH CHECK (is_superadmin());

-- Only superadmins can update event admin assignments
DROP POLICY IF EXISTS "Superadmins can update event admins" ON event_admins;
CREATE POLICY "Superadmins can update event admins"
  ON event_admins FOR UPDATE
  USING (is_superadmin());

-- Only superadmins can delete event admin assignments
DROP POLICY IF EXISTS "Superadmins can delete event admins" ON event_admins;
CREATE POLICY "Superadmins can delete event admins"
  ON event_admins FOR DELETE
  USING (is_superadmin());

-- ============================================
-- UPDATE EVENTS TABLE POLICIES
-- ============================================

-- Event admins can update their assigned events (not just superadmins)
DROP POLICY IF EXISTS "Event admins can update own events" ON events;
CREATE POLICY "Event admins can update own events"
  ON events FOR UPDATE
  USING (is_event_admin(id))
  WITH CHECK (is_event_admin(id));

-- ============================================
-- EVENT ADMIN ACTIVITY LOG
-- ============================================

-- Track event admin actions for audit
CREATE TABLE IF NOT EXISTS event_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- e.g., 'participant', 'submission', 'settings'
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_admin_logs_event ON event_admin_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admin_logs_admin ON event_admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_event_admin_logs_created ON event_admin_logs(created_at DESC);

ALTER TABLE event_admin_logs ENABLE ROW LEVEL SECURITY;

-- Event admins can view their event's logs
DROP POLICY IF EXISTS "Event admins can view event logs" ON event_admin_logs;
CREATE POLICY "Event admins can view event logs"
  ON event_admin_logs FOR SELECT
  USING (is_event_admin(event_id));

-- Event admins can create logs for their events
DROP POLICY IF EXISTS "Event admins can create event logs" ON event_admin_logs;
CREATE POLICY "Event admins can create event logs"
  ON event_admin_logs FOR INSERT
  WITH CHECK (is_event_admin(event_id));

-- ============================================
-- ADD METHODOLOGY_ID TO EVENTS CONFIG
-- ============================================

-- Update existing Appathon 2.0 event to include methodology_id
UPDATE events
SET config = config || '{"methodology_id": "flywheel-8-appathon"}'::jsonb
WHERE slug = 'appathon-2'
AND NOT (config ? 'methodology_id');

-- ============================================
-- ADMIN VIEW: EVENT OVERVIEW
-- ============================================

CREATE OR REPLACE VIEW admin_event_overview AS
SELECT
  e.id as event_id,
  e.slug,
  e.name,
  e.start_date,
  e.end_date,
  e.is_active,
  e.config->>'methodology_id' as methodology_id,
  (SELECT COUNT(*) FROM users u WHERE u.active_event_id = e.id) as participant_count,
  (SELECT COUNT(*) FROM cycles c
   JOIN users u ON c.user_id = u.id
   WHERE u.active_event_id = e.id) as cycle_count,
  (SELECT COUNT(*) FROM event_admins ea WHERE ea.event_id = e.id) as admin_count,
  e.created_at
FROM events e
ORDER BY e.start_date DESC;

GRANT SELECT ON admin_event_overview TO authenticated;

-- ============================================
-- FUNCTION: ASSIGN EVENT ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION assign_event_admin(
  p_event_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'admin',
  p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Only superadmins can assign event admins
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can assign event admins';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'reviewer', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, reviewer, or viewer', p_role;
  END IF;

  -- Insert or update the assignment
  INSERT INTO event_admins (event_id, user_id, role, permissions, assigned_by)
  VALUES (p_event_id, p_user_id, p_role, p_permissions, auth.uid())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    assigned_by = auth.uid(),
    assigned_at = NOW()
  RETURNING id INTO new_id;

  -- Log the action
  INSERT INTO event_admin_logs (event_id, admin_id, action, entity_type, entity_id, details)
  VALUES (
    p_event_id,
    auth.uid(),
    'assign_admin',
    'user',
    p_user_id,
    jsonb_build_object('role', p_role, 'permissions', p_permissions)
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: REMOVE EVENT ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION remove_event_admin(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only superadmins can remove event admins
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can remove event admins';
  END IF;

  -- Delete the assignment
  DELETE FROM event_admins
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- Log the action
  INSERT INTO event_admin_logs (event_id, admin_id, action, entity_type, entity_id)
  VALUES (p_event_id, auth.uid(), 'remove_admin', 'user', p_user_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
