-- Flywheel Coach Super Admin Schema
-- Run this after 002_schema_updates.sql

-- ============================================
-- UPDATE ROLE CONSTRAINT
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('learner', 'facilitator', 'admin', 'superadmin'));

-- ============================================
-- SUPERADMIN CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADMIN TABLES
-- ============================================

-- Admin notes on cycles
CREATE TABLE IF NOT EXISTS admin_cycle_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cycle review status
CREATE TABLE IF NOT EXISTS cycle_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'needs_revision', 'flagged')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impersonation audit log
CREATE TABLE IF NOT EXISTS impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('start', 'end')),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR ADMIN TABLES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_cycle_notes_cycle ON admin_cycle_notes(cycle_id);
CREATE INDEX IF NOT EXISTS idx_admin_cycle_notes_admin ON admin_cycle_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_cycle_reviews_cycle ON cycle_reviews(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_reviews_status ON cycle_reviews(status);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_admin ON impersonation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_target ON impersonation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_entity ON admin_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON admin_activity_logs(created_at DESC);

-- ============================================
-- ENABLE RLS ON ADMIN TABLES
-- ============================================

ALTER TABLE admin_cycle_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN TABLE POLICIES (superadmin only)
-- ============================================

-- Admin cycle notes policies
DROP POLICY IF EXISTS "Superadmin can view all cycle notes" ON admin_cycle_notes;
CREATE POLICY "Superadmin can view all cycle notes"
  ON admin_cycle_notes FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can insert cycle notes" ON admin_cycle_notes;
CREATE POLICY "Superadmin can insert cycle notes"
  ON admin_cycle_notes FOR INSERT
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update cycle notes" ON admin_cycle_notes;
CREATE POLICY "Superadmin can update cycle notes"
  ON admin_cycle_notes FOR UPDATE
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can delete cycle notes" ON admin_cycle_notes;
CREATE POLICY "Superadmin can delete cycle notes"
  ON admin_cycle_notes FOR DELETE
  USING (is_superadmin());

-- Cycle reviews policies
DROP POLICY IF EXISTS "Superadmin can view all cycle reviews" ON cycle_reviews;
CREATE POLICY "Superadmin can view all cycle reviews"
  ON cycle_reviews FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can insert cycle reviews" ON cycle_reviews;
CREATE POLICY "Superadmin can insert cycle reviews"
  ON cycle_reviews FOR INSERT
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update cycle reviews" ON cycle_reviews;
CREATE POLICY "Superadmin can update cycle reviews"
  ON cycle_reviews FOR UPDATE
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can delete cycle reviews" ON cycle_reviews;
CREATE POLICY "Superadmin can delete cycle reviews"
  ON cycle_reviews FOR DELETE
  USING (is_superadmin());

-- Impersonation logs policies
DROP POLICY IF EXISTS "Superadmin can view impersonation logs" ON impersonation_logs;
CREATE POLICY "Superadmin can view impersonation logs"
  ON impersonation_logs FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can insert impersonation logs" ON impersonation_logs;
CREATE POLICY "Superadmin can insert impersonation logs"
  ON impersonation_logs FOR INSERT
  WITH CHECK (is_superadmin());

-- Admin activity logs policies
DROP POLICY IF EXISTS "Superadmin can view activity logs" ON admin_activity_logs;
CREATE POLICY "Superadmin can view activity logs"
  ON admin_activity_logs FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can insert activity logs" ON admin_activity_logs;
CREATE POLICY "Superadmin can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (is_superadmin());

-- ============================================
-- SUPERADMIN BYPASS POLICIES FOR EXISTING TABLES
-- ============================================

-- Users table - superadmin can view/update all users
DROP POLICY IF EXISTS "Superadmin can view all users" ON users;
CREATE POLICY "Superadmin can view all users"
  ON users FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all users" ON users;
CREATE POLICY "Superadmin can update all users"
  ON users FOR UPDATE
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can insert users" ON users;
CREATE POLICY "Superadmin can insert users"
  ON users FOR INSERT
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can delete users" ON users;
CREATE POLICY "Superadmin can delete users"
  ON users FOR DELETE
  USING (is_superadmin());

-- Cycles table - superadmin can view/update all cycles
DROP POLICY IF EXISTS "Superadmin can view all cycles" ON cycles;
CREATE POLICY "Superadmin can view all cycles"
  ON cycles FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all cycles" ON cycles;
CREATE POLICY "Superadmin can update all cycles"
  ON cycles FOR UPDATE
  USING (is_superadmin());

-- Problems table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all problems" ON problems;
CREATE POLICY "Superadmin can view all problems"
  ON problems FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all problems" ON problems;
CREATE POLICY "Superadmin can update all problems"
  ON problems FOR UPDATE
  USING (is_superadmin());

-- Contexts table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all contexts" ON contexts;
CREATE POLICY "Superadmin can view all contexts"
  ON contexts FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all contexts" ON contexts;
CREATE POLICY "Superadmin can update all contexts"
  ON contexts FOR UPDATE
  USING (is_superadmin());

-- Interviews table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all interviews" ON interviews;
CREATE POLICY "Superadmin can view all interviews"
  ON interviews FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all interviews" ON interviews;
CREATE POLICY "Superadmin can update all interviews"
  ON interviews FOR UPDATE
  USING (is_superadmin());

-- Value assessments table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all value assessments" ON value_assessments;
CREATE POLICY "Superadmin can view all value assessments"
  ON value_assessments FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all value assessments" ON value_assessments;
CREATE POLICY "Superadmin can update all value assessments"
  ON value_assessments FOR UPDATE
  USING (is_superadmin());

-- Workflow classifications table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all workflow classifications" ON workflow_classifications;
CREATE POLICY "Superadmin can view all workflow classifications"
  ON workflow_classifications FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all workflow classifications" ON workflow_classifications;
CREATE POLICY "Superadmin can update all workflow classifications"
  ON workflow_classifications FOR UPDATE
  USING (is_superadmin());

-- Prompts table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all prompts" ON prompts;
CREATE POLICY "Superadmin can view all prompts"
  ON prompts FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all prompts" ON prompts;
CREATE POLICY "Superadmin can update all prompts"
  ON prompts FOR UPDATE
  USING (is_superadmin());

-- Builds table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all builds" ON builds;
CREATE POLICY "Superadmin can view all builds"
  ON builds FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all builds" ON builds;
CREATE POLICY "Superadmin can update all builds"
  ON builds FOR UPDATE
  USING (is_superadmin());

-- Impact assessments table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all impact assessments" ON impact_assessments;
CREATE POLICY "Superadmin can view all impact assessments"
  ON impact_assessments FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all impact assessments" ON impact_assessments;
CREATE POLICY "Superadmin can update all impact assessments"
  ON impact_assessments FOR UPDATE
  USING (is_superadmin());

-- Impacts table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all impacts" ON impacts;
CREATE POLICY "Superadmin can view all impacts"
  ON impacts FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all impacts" ON impacts;
CREATE POLICY "Superadmin can update all impacts"
  ON impacts FOR UPDATE
  USING (is_superadmin());

-- Conversations table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all conversations" ON conversations;
CREATE POLICY "Superadmin can view all conversations"
  ON conversations FOR SELECT
  USING (is_superadmin());

-- Messages table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all messages" ON messages;
CREATE POLICY "Superadmin can view all messages"
  ON messages FOR SELECT
  USING (is_superadmin());

-- Badges table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all badges" ON badges;
CREATE POLICY "Superadmin can view all badges"
  ON badges FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can manage badges" ON badges;
CREATE POLICY "Superadmin can manage badges"
  ON badges FOR ALL
  USING (is_superadmin());

-- Skill progress table - superadmin access
DROP POLICY IF EXISTS "Superadmin can view all skill progress" ON skill_progress;
CREATE POLICY "Superadmin can view all skill progress"
  ON skill_progress FOR SELECT
  USING (is_superadmin());

DROP POLICY IF EXISTS "Superadmin can update all skill progress" ON skill_progress;
CREATE POLICY "Superadmin can update all skill progress"
  ON skill_progress FOR UPDATE
  USING (is_superadmin());

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- User statistics by role
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  role,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
FROM users
GROUP BY role;

-- Cycle statistics by status
CREATE OR REPLACE VIEW admin_cycle_stats AS
SELECT
  status,
  COUNT(*) as count,
  AVG(current_step) as avg_step,
  COUNT(*) FILTER (WHERE current_step = 8) as completed_all_steps,
  AVG(impact_score) FILTER (WHERE impact_score IS NOT NULL) as avg_impact_score
FROM cycles
GROUP BY status;

-- Step funnel - how many users at each step
CREATE OR REPLACE VIEW admin_step_funnel AS
SELECT
  current_step,
  COUNT(*) as users_at_step,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cycles WHERE status = 'active') as percentage
FROM cycles
WHERE status = 'active'
GROUP BY current_step
ORDER BY current_step;

-- Workflow type popularity
CREATE OR REPLACE VIEW admin_workflow_popularity AS
SELECT
  workflow_type,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM workflow_classifications) as percentage
FROM workflow_classifications
WHERE workflow_type IS NOT NULL
GROUP BY workflow_type
ORDER BY count DESC;

-- Recent activity summary
CREATE OR REPLACE VIEW admin_recent_activity AS
SELECT
  'cycle' as entity_type,
  id as entity_id,
  user_id,
  'created' as action,
  created_at
FROM cycles
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'problem' as entity_type,
  id as entity_id,
  (SELECT user_id FROM cycles WHERE cycles.id = problems.cycle_id) as user_id,
  CASE WHEN completed THEN 'completed' ELSE 'updated' END as action,
  updated_at as created_at
FROM problems
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================

DROP TRIGGER IF EXISTS update_admin_cycle_notes_updated_at ON admin_cycle_notes;
CREATE TRIGGER update_admin_cycle_notes_updated_at
  BEFORE UPDATE ON admin_cycle_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cycle_reviews_updated_at ON cycle_reviews;
CREATE TRIGGER update_cycle_reviews_updated_at
  BEFORE UPDATE ON cycle_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT ACCESS TO VIEWS FOR AUTHENTICATED USERS
-- (RLS will still apply through the underlying tables)
-- ============================================

GRANT SELECT ON admin_user_stats TO authenticated;
GRANT SELECT ON admin_cycle_stats TO authenticated;
GRANT SELECT ON admin_step_funnel TO authenticated;
GRANT SELECT ON admin_workflow_popularity TO authenticated;
GRANT SELECT ON admin_recent_activity TO authenticated;
