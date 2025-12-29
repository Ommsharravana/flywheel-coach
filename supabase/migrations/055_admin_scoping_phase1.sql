-- Phase 1: Admin Data Scoping - Database Foundation
-- Creates institutions table (if not exists), institution_admins, admin_audit_log
-- Adds denormalized columns for faster filtering
-- Based on /docs/specs/admin-data-scoping.md

-- ============================================
-- 1. INSTITUTIONS TABLE (ENSURE EXISTS)
-- ============================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_institutions_updated_at'
  ) THEN
    CREATE TRIGGER update_institutions_updated_at
      BEFORE UPDATE ON institutions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Ensure short_name column exists (might be missing in production)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'institutions' AND column_name = 'short_name'
  ) THEN
    ALTER TABLE institutions ADD COLUMN short_name TEXT;
  END IF;
END $$;

-- Ensure code column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'institutions' AND column_name = 'code'
  ) THEN
    ALTER TABLE institutions ADD COLUMN code TEXT UNIQUE;
  END IF;
END $$;

-- ============================================
-- 2. SEED JKKN INSTITUTIONS (IF NOT EXISTS)
-- ============================================

INSERT INTO institutions (name, short_name, code)
SELECT name, short_name, code
FROM (VALUES
  ('JKKN College of Pharmacy', 'JKKN Pharmacy', 'JKKN-PHARM'),
  ('JKKN College of Arts & Science', 'JKKN Arts', 'JKKN-ARTS'),
  ('JKKN College of Engineering & Technology', 'JKKN Engineering', 'JKKN-ENGG'),
  ('JKKN College of Allied Health Sciences', 'JKKN Allied Health', 'JKKN-AHS'),
  ('JKKN Educational Institutions', 'JKKN Central', 'JKKN-CENTRAL'),
  ('JKKN Dental College & Hospital', 'JKKN Dental', 'JKKN-DENTAL'),
  ('JKKN College of Nursing', 'JKKN Nursing', 'JKKN-NURSE'),
  ('JKKN College of Physiotherapy', 'JKKN Physio', 'JKKN-PHYSIO')
) AS v(name, short_name, code)
WHERE NOT EXISTS (
  SELECT 1 FROM institutions WHERE institutions.code = v.code
);

-- RLS for institutions
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Everyone can view institutions
DROP POLICY IF EXISTS "Anyone can view institutions" ON institutions;
CREATE POLICY "Anyone can view institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

-- Only superadmin can modify institutions
DROP POLICY IF EXISTS "Superadmins can manage institutions" ON institutions;
CREATE POLICY "Superadmins can manage institutions"
  ON institutions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- 3. INSTITUTION_ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_admins_user ON institution_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_admins_institution ON institution_admins(institution_id);

-- RLS for institution_admins
ALTER TABLE institution_admins ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all
DROP POLICY IF EXISTS "Superadmins can view all institution_admins" ON institution_admins;
CREATE POLICY "Superadmins can view all institution_admins"
  ON institution_admins FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Event admins can view (read-only)
DROP POLICY IF EXISTS "Event admins can view institution_admins" ON institution_admins;
CREATE POLICY "Event admins can view institution_admins"
  ON institution_admins FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM event_admins WHERE user_id = auth.uid())
  );

-- Only superadmins can modify
DROP POLICY IF EXISTS "Superadmins can manage institution_admins" ON institution_admins;
CREATE POLICY "Superadmins can manage institution_admins"
  ON institution_admins FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- 4. ADMIN_AUDIT_LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_role TEXT NOT NULL, -- 'superadmin', 'event_admin', 'institution_admin'
  action_type TEXT NOT NULL, -- 'page_view', 'create', 'update', 'delete', 'filter_change', 'export'
  resource_type TEXT NOT NULL, -- 'user', 'cycle', 'submission', 'problem', 'event', 'institution', 'role'
  resource_id UUID,
  page_path TEXT, -- For page_view actions
  filters_applied JSONB, -- What filters were active
  event_id UUID REFERENCES events(id),
  institution_id UUID REFERENCES institutions(id),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON admin_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_institution ON admin_audit_log(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action_type);

-- RLS for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Superadmins can see all audit logs
DROP POLICY IF EXISTS "Superadmins can view all audit logs" ON admin_audit_log;
CREATE POLICY "Superadmins can view all audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Event admins can see audit logs for their events
DROP POLICY IF EXISTS "Event admins can view own event audit logs" ON admin_audit_log;
CREATE POLICY "Event admins can view own event audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    event_id IN (SELECT event_id FROM event_admins WHERE user_id = auth.uid())
  );

-- Anyone can insert their own audit logs (for logging their actions)
DROP POLICY IF EXISTS "Admins can insert own audit logs" ON admin_audit_log;
CREATE POLICY "Admins can insert own audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (
    admin_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
      OR EXISTS (SELECT 1 FROM event_admins WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM institution_admins WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- 5. ADD INSTITUTION_ID TO CYCLES (IF NOT EXISTS)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cycles' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE cycles ADD COLUMN institution_id UUID REFERENCES institutions(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cycles_institution ON cycles(institution_id);

-- ============================================
-- 6. ADD INSTITUTION_IDS ARRAY TO APPATHON_SUBMISSIONS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appathon_submissions' AND column_name = 'institution_ids'
  ) THEN
    ALTER TABLE appathon_submissions ADD COLUMN institution_ids UUID[] DEFAULT '{}';
  END IF;
END $$;

-- GIN index for array containment queries
CREATE INDEX IF NOT EXISTS idx_submissions_institution_ids ON appathon_submissions USING GIN (institution_ids);

-- ============================================
-- 7. ADD INSTITUTION_ID TO USERS (IF NOT EXISTS)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE users ADD COLUMN institution_id UUID REFERENCES institutions(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);

-- ============================================
-- 8. POPULATE EXISTING DATA
-- ============================================

-- Populate cycles.institution_id from user's institution
UPDATE cycles c
SET institution_id = u.institution_id
FROM users u
WHERE c.user_id = u.id
AND c.institution_id IS NULL
AND u.institution_id IS NOT NULL;

-- Populate appathon_submissions.institution_ids from existing data
-- First, try to get from the single institution_id column
UPDATE appathon_submissions s
SET institution_ids = ARRAY[s.institution_id]
WHERE s.institution_id IS NOT NULL
AND (s.institution_ids IS NULL OR s.institution_ids = '{}');

-- Then extract from team_members JSONB if available
-- This extracts institution_ids from team_members where institution is stored as name
-- We'll need to match institution names to IDs
UPDATE appathon_submissions s
SET institution_ids = (
  SELECT ARRAY_AGG(DISTINCT i.id)
  FROM (
    SELECT DISTINCT jsonb_array_elements(s.team_members)->>'institution' as inst_name
  ) tm
  JOIN institutions i ON i.name ILIKE tm.inst_name OR i.short_name ILIKE tm.inst_name
  WHERE tm.inst_name IS NOT NULL
)
WHERE s.team_members IS NOT NULL
AND jsonb_array_length(s.team_members) > 0
AND (s.institution_ids IS NULL OR s.institution_ids = '{}');

-- Combine existing institution_id with team_members institutions
UPDATE appathon_submissions s
SET institution_ids = (
  SELECT ARRAY_AGG(DISTINCT inst_id) FROM (
    SELECT UNNEST(s.institution_ids) as inst_id
    UNION
    SELECT s.institution_id WHERE s.institution_id IS NOT NULL
  ) combined
  WHERE inst_id IS NOT NULL
)
WHERE s.institution_id IS NOT NULL
AND NOT (s.institution_id = ANY(COALESCE(s.institution_ids, '{}')));

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to check if user is an institution admin
CREATE OR REPLACE FUNCTION is_institution_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_admins WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's admin institution IDs
CREATE OR REPLACE FUNCTION get_admin_institution_ids(check_user_id UUID DEFAULT auth.uid())
RETURNS UUID[] AS $$
DECLARE
  result UUID[];
BEGIN
  SELECT ARRAY_AGG(institution_id) INTO result
  FROM institution_admins
  WHERE user_id = check_user_id;

  RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE institution_admins IS 'Maps users to institutions they can administer. Institution admins have read-only access to data from their institution.';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all admin actions including page views, CRUD operations, and filter changes.';
COMMENT ON COLUMN cycles.institution_id IS 'Denormalized from user for faster institution-scoped queries.';
COMMENT ON COLUMN appathon_submissions.institution_ids IS 'Array of all institutions represented in the team (for cross-institutional team filtering).';
COMMENT ON FUNCTION is_institution_admin IS 'Returns true if the user is an institution admin for any institution.';
COMMENT ON FUNCTION get_admin_institution_ids IS 'Returns array of institution IDs the user can administer.';
