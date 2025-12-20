-- Flywheel Coach Institution Management Schema
-- Run this after 005_events_system.sql

-- ============================================
-- INSTITUTIONS TABLE
-- ============================================

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,              -- e.g., 'jkkn-engineering'
  name TEXT NOT NULL,                     -- e.g., 'JKKN College of Engineering & Technology'
  short_name TEXT NOT NULL,               -- e.g., 'Engineering'
  type TEXT NOT NULL DEFAULT 'college',   -- 'college' | 'school' | 'external'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD INSTITUTION_ID TO USERS
-- ============================================

-- Add institution_id column to users (FK to institutions)
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- ============================================
-- INSTITUTION CHANGE REQUESTS TABLE
-- ============================================

CREATE TABLE institution_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_institution_id UUID REFERENCES institutions(id),
  to_institution_id UUID NOT NULL REFERENCES institutions(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATE ROLE CONSTRAINT TO INCLUDE INSTITUTION_ADMIN
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'facilitator', 'admin', 'institution_admin', 'superadmin'));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is institution admin
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

-- Get user's institution_id
CREATE OR REPLACE FUNCTION get_user_institution_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT institution_id FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin of a specific institution
CREATE OR REPLACE FUNCTION is_admin_of_institution(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'institution_admin'
    AND institution_id = inst_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_institutions_slug ON institutions(slug);
CREATE INDEX idx_institutions_type ON institutions(type);
CREATE INDEX idx_institutions_active ON institutions(is_active);
CREATE INDEX idx_change_requests_user ON institution_change_requests(user_id);
CREATE INDEX idx_change_requests_status ON institution_change_requests(status);
CREATE INDEX idx_change_requests_to_inst ON institution_change_requests(to_institution_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_change_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INSTITUTIONS RLS POLICIES
-- ============================================

-- Anyone can view active institutions (for institution selection page)
DROP POLICY IF EXISTS "Anyone can view active institutions" ON institutions;
CREATE POLICY "Anyone can view active institutions"
  ON institutions FOR SELECT
  USING (is_active = true);

-- Superadmins can view all institutions (including inactive)
DROP POLICY IF EXISTS "Superadmin can view all institutions" ON institutions;
CREATE POLICY "Superadmin can view all institutions"
  ON institutions FOR SELECT
  USING (is_superadmin());

-- Superadmins can manage all institutions
DROP POLICY IF EXISTS "Superadmin can insert institutions" ON institutions;
CREATE POLICY "Superadmin can insert institutions"
  ON institutions FOR INSERT
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update institutions" ON institutions;
CREATE POLICY "Superadmin can update institutions"
  ON institutions FOR UPDATE
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can delete institutions" ON institutions;
CREATE POLICY "Superadmin can delete institutions"
  ON institutions FOR DELETE
  USING (is_superadmin());

-- ============================================
-- CHANGE REQUESTS RLS POLICIES
-- ============================================

-- Users can view their own change requests
DROP POLICY IF EXISTS "Users can view own change requests" ON institution_change_requests;
CREATE POLICY "Users can view own change requests"
  ON institution_change_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own change requests
DROP POLICY IF EXISTS "Users can create own change requests" ON institution_change_requests;
CREATE POLICY "Users can create own change requests"
  ON institution_change_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Institution admins can view requests for their institution
DROP POLICY IF EXISTS "Institution admins can view institution requests" ON institution_change_requests;
CREATE POLICY "Institution admins can view institution requests"
  ON institution_change_requests FOR SELECT
  USING (
    is_institution_admin() AND
    to_institution_id = get_user_institution_id()
  );

-- Institution admins can update requests for their institution
DROP POLICY IF EXISTS "Institution admins can update institution requests" ON institution_change_requests;
CREATE POLICY "Institution admins can update institution requests"
  ON institution_change_requests FOR UPDATE
  USING (
    is_institution_admin() AND
    to_institution_id = get_user_institution_id()
  );

-- Superadmins can view all change requests
DROP POLICY IF EXISTS "Superadmin can view all change requests" ON institution_change_requests;
CREATE POLICY "Superadmin can view all change requests"
  ON institution_change_requests FOR SELECT
  USING (is_superadmin());

-- Superadmins can update all change requests
DROP POLICY IF EXISTS "Superadmin can update all change requests" ON institution_change_requests;
CREATE POLICY "Superadmin can update all change requests"
  ON institution_change_requests FOR UPDATE
  USING (is_superadmin());

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED 9 JKKN INSTITUTIONS
-- ============================================

INSERT INTO institutions (slug, name, short_name, type) VALUES
  ('jkkn-engineering', 'JKKN College of Engineering & Technology', 'Engineering', 'college'),
  ('jkkn-arts-science', 'JKKN College of Arts & Science', 'Arts & Science', 'college'),
  ('jkkn-nursing', 'JKKN College of Nursing', 'Nursing', 'college'),
  ('jkkn-dental', 'JKKN Dental College and Hospital', 'Dental', 'college'),
  ('jkkn-pharmacy', 'JKKN College of Pharmacy', 'Pharmacy', 'college'),
  ('jkkn-ahs', 'JKKN College of Allied Health Sciences', 'Allied Health', 'college'),
  ('jkkn-education', 'JKKN College of Education', 'Education', 'college'),
  ('jkkn-matric', 'JKKN Matriculation Higher Secondary School', 'Matric HSS', 'school'),
  ('nattraja-vidhyalaya', 'Nattraja Vidhyalaya', 'NV School', 'school')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Institution statistics
CREATE OR REPLACE VIEW admin_institution_stats AS
SELECT
  i.id,
  i.slug,
  i.name,
  i.short_name,
  i.type,
  i.is_active,
  COUNT(u.id) as user_count,
  COUNT(u.id) FILTER (WHERE u.role = 'institution_admin') as admin_count,
  COUNT(u.id) FILTER (WHERE u.created_at > NOW() - INTERVAL '7 days') as new_users_this_week
FROM institutions i
LEFT JOIN users u ON u.institution_id = i.id
GROUP BY i.id, i.slug, i.name, i.short_name, i.type, i.is_active;

-- Pending change requests summary
CREATE OR REPLACE VIEW admin_pending_change_requests AS
SELECT
  icr.id,
  icr.user_id,
  u.email as user_email,
  u.name as user_name,
  fi.name as from_institution,
  ti.name as to_institution,
  icr.reason,
  icr.created_at
FROM institution_change_requests icr
JOIN users u ON u.id = icr.user_id
LEFT JOIN institutions fi ON fi.id = icr.from_institution_id
JOIN institutions ti ON ti.id = icr.to_institution_id
WHERE icr.status = 'pending'
ORDER BY icr.created_at DESC;

-- Grant access to views
GRANT SELECT ON admin_institution_stats TO authenticated;
GRANT SELECT ON admin_pending_change_requests TO authenticated;
