-- ============================================
-- NIF CYCLE APPLICATIONS & MENTORS
-- Learner-initiated incubation applications for completed cycles
-- ============================================

-- ============================================
-- Mentor Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (if internal user)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Mentor info (for external or when user_id is null)
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Profile
  title TEXT, -- e.g., "CEO, TechCorp" or "Professor, JKKN Engineering"
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,

  -- Expertise
  domains TEXT[] DEFAULT '{}', -- e.g., ['healthcare', 'ai', 'fintech']
  skills TEXT[] DEFAULT '{}', -- e.g., ['product', 'fundraising', 'technical']

  -- Type
  mentor_type TEXT NOT NULL DEFAULT 'industry', -- senior_learner, industry, nif_staff
  institution_id UUID REFERENCES institutions(id),

  -- Capacity
  max_mentees INT DEFAULT 5,
  current_mentees INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,

  -- Status
  status TEXT DEFAULT 'active', -- active, inactive, on_leave

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NIF Cycle Applications
-- ============================================
CREATE TABLE IF NOT EXISTS nif_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source cycle
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Application details
  tier TEXT NOT NULL DEFAULT 'tier1', -- tier1: light support, tier2: full incubation
  startup_name TEXT,
  team_description TEXT, -- Who's on the team?
  motivation TEXT NOT NULL, -- Why do you want to be incubated?
  goals TEXT, -- What do you hope to achieve?

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, under_review, mentor_selection, active, completed, rejected, withdrawn

  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Mentor assignment (admin suggests 3, applicant picks 1)
  suggested_mentors UUID[] DEFAULT '{}', -- Array of mentor IDs
  selected_mentor_id UUID REFERENCES mentors(id),
  mentor_selected_at TIMESTAMPTZ,

  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ, -- When mentorship starts
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cycle_id)
);

-- ============================================
-- NIF Application Activity Log
-- ============================================
CREATE TABLE IF NOT EXISTS nif_application_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES nif_applications(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL, -- status_change, note_added, mentor_suggested, mentor_selected
  from_value TEXT,
  to_value TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Mentorship Sessions (optional tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES nif_applications(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,

  session_date DATE,
  duration_minutes INT,
  notes TEXT,
  action_items TEXT[],

  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mentors_type ON mentors(mentor_type);
CREATE INDEX IF NOT EXISTS idx_mentors_available ON mentors(is_available, status);
CREATE INDEX IF NOT EXISTS idx_mentors_domains ON mentors USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_mentors_user ON mentors(user_id);

CREATE INDEX IF NOT EXISTS idx_nif_applications_cycle ON nif_applications(cycle_id);
CREATE INDEX IF NOT EXISTS idx_nif_applications_user ON nif_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_nif_applications_status ON nif_applications(status);
CREATE INDEX IF NOT EXISTS idx_nif_applications_mentor ON nif_applications(selected_mentor_id);

CREATE INDEX IF NOT EXISTS idx_nif_app_activity_app ON nif_application_activity(application_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_app ON mentorship_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor ON mentorship_sessions(mentor_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE nif_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nif_application_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Mentors: Anyone can view active mentors
DROP POLICY IF EXISTS "Anyone can view active mentors" ON mentors;
CREATE POLICY "Anyone can view active mentors" ON mentors
  FOR SELECT TO authenticated
  USING (status = 'active' AND is_available = true);

DROP POLICY IF EXISTS "Superadmins full access to mentors" ON mentors;
CREATE POLICY "Superadmins full access to mentors" ON mentors
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- NIF Applications: Users can view and manage their own
DROP POLICY IF EXISTS "Users can view own applications" ON nif_applications;
CREATE POLICY "Users can view own applications" ON nif_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own applications" ON nif_applications;
CREATE POLICY "Users can insert own applications" ON nif_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own applications" ON nif_applications;
CREATE POLICY "Users can update own applications" ON nif_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmins full access to applications" ON nif_applications;
CREATE POLICY "Superadmins full access to applications" ON nif_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Application Activity: Users can view their own, admins all
DROP POLICY IF EXISTS "Users can view own activity" ON nif_application_activity;
CREATE POLICY "Users can view own activity" ON nif_application_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nif_applications
      WHERE id = nif_application_activity.application_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Superadmins full access to activity" ON nif_application_activity;
CREATE POLICY "Superadmins full access to activity" ON nif_application_activity
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Mentorship Sessions
DROP POLICY IF EXISTS "Involved parties can view sessions" ON mentorship_sessions;
CREATE POLICY "Involved parties can view sessions" ON mentorship_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nif_applications na
      WHERE na.id = mentorship_sessions.application_id
      AND (na.user_id = auth.uid() OR na.selected_mentor_id IN (
        SELECT id FROM mentors WHERE user_id = auth.uid()
      ))
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Superadmins full access to sessions" ON mentorship_sessions;
CREATE POLICY "Superadmins full access to sessions" ON mentorship_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_nif_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mentors_updated_at ON mentors;
CREATE TRIGGER mentors_updated_at
  BEFORE UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION update_nif_tables_updated_at();

DROP TRIGGER IF EXISTS nif_applications_updated_at ON nif_applications;
CREATE TRIGGER nif_applications_updated_at
  BEFORE UPDATE ON nif_applications
  FOR EACH ROW EXECUTE FUNCTION update_nif_tables_updated_at();

-- Track application status changes
CREATE OR REPLACE FUNCTION track_nif_application_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO nif_application_activity (application_id, activity_type, from_value, to_value, performed_by)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, auth.uid());

    -- Update timestamps based on status
    IF NEW.status = 'active' THEN
      NEW.activated_at = NOW();
    ELSIF NEW.status = 'completed' THEN
      NEW.completed_at = NOW();
    ELSIF NEW.status IN ('rejected', 'under_review') THEN
      NEW.reviewed_at = NOW();
      NEW.reviewed_by = auth.uid();
    END IF;
  END IF;

  -- Track mentor selection
  IF OLD.selected_mentor_id IS DISTINCT FROM NEW.selected_mentor_id AND NEW.selected_mentor_id IS NOT NULL THEN
    INSERT INTO nif_application_activity (application_id, activity_type, to_value, performed_by)
    VALUES (NEW.id, 'mentor_selected', NEW.selected_mentor_id::TEXT, auth.uid());
    NEW.mentor_selected_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS nif_application_status_tracker ON nif_applications;
CREATE TRIGGER nif_application_status_tracker
  BEFORE UPDATE ON nif_applications
  FOR EACH ROW EXECUTE FUNCTION track_nif_application_status();

-- Update mentor current_mentees count
CREATE OR REPLACE FUNCTION update_mentor_mentee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old mentor count if changing
  IF OLD.selected_mentor_id IS NOT NULL AND OLD.selected_mentor_id IS DISTINCT FROM NEW.selected_mentor_id THEN
    UPDATE mentors SET current_mentees = GREATEST(0, current_mentees - 1)
    WHERE id = OLD.selected_mentor_id;
  END IF;

  -- Increment new mentor count
  IF NEW.selected_mentor_id IS NOT NULL AND OLD.selected_mentor_id IS DISTINCT FROM NEW.selected_mentor_id THEN
    UPDATE mentors SET current_mentees = current_mentees + 1
    WHERE id = NEW.selected_mentor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS mentor_mentee_counter ON nif_applications;
CREATE TRIGGER mentor_mentee_counter
  AFTER UPDATE ON nif_applications
  FOR EACH ROW EXECUTE FUNCTION update_mentor_mentee_count();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if a cycle is eligible for NIF application
CREATE OR REPLACE FUNCTION is_cycle_nif_eligible(p_cycle_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cycle RECORD;
  v_impact RECORD;
BEGIN
  -- Get cycle details
  SELECT * INTO v_cycle FROM cycles WHERE id = p_cycle_id;

  IF NOT FOUND OR v_cycle.status != 'completed' THEN
    RETURN FALSE;
  END IF;

  -- Check if already applied
  IF EXISTS (SELECT 1 FROM nif_applications WHERE cycle_id = p_cycle_id) THEN
    RETURN FALSE;
  END IF;

  -- Get impact assessment
  SELECT * INTO v_impact FROM impact_assessments WHERE cycle_id = p_cycle_id;

  -- Require completed impact assessment with some user traction
  IF NOT FOUND OR v_impact.total_users IS NULL OR v_impact.total_users < 1 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available mentors for a domain
CREATE OR REPLACE FUNCTION get_available_mentors(p_domain TEXT DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  mentor_type TEXT,
  domains TEXT[],
  skills TEXT[],
  current_mentees INT,
  max_mentees INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.title,
    m.bio,
    m.avatar_url,
    m.mentor_type,
    m.domains,
    m.skills,
    m.current_mentees,
    m.max_mentees
  FROM mentors m
  WHERE m.status = 'active'
    AND m.is_available = true
    AND m.current_mentees < m.max_mentees
    AND (p_domain IS NULL OR p_domain = ANY(m.domains))
  ORDER BY m.current_mentees ASC, m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit NIF application
CREATE OR REPLACE FUNCTION submit_nif_application(
  p_cycle_id UUID,
  p_startup_name TEXT DEFAULT NULL,
  p_team_description TEXT DEFAULT NULL,
  p_motivation TEXT DEFAULT NULL,
  p_goals TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT 'tier1'
)
RETURNS UUID AS $$
DECLARE
  v_application_id UUID;
BEGIN
  -- Check eligibility
  IF NOT is_cycle_nif_eligible(p_cycle_id) THEN
    RAISE EXCEPTION 'Cycle is not eligible for NIF application';
  END IF;

  -- Create application
  INSERT INTO nif_applications (
    cycle_id,
    user_id,
    tier,
    startup_name,
    team_description,
    motivation,
    goals
  )
  VALUES (
    p_cycle_id,
    auth.uid(),
    p_tier,
    p_startup_name,
    p_team_description,
    p_motivation,
    p_goals
  )
  RETURNING id INTO v_application_id;

  -- Log activity
  INSERT INTO nif_application_activity (application_id, activity_type, to_value, performed_by)
  VALUES (v_application_id, 'status_change', 'pending', auth.uid());

  RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Suggest mentors for an application
CREATE OR REPLACE FUNCTION suggest_mentors_for_application(
  p_application_id UUID,
  p_mentor_ids UUID[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin') THEN
    RAISE EXCEPTION 'Only admins can suggest mentors';
  END IF;

  -- Update application
  UPDATE nif_applications
  SET
    suggested_mentors = p_mentor_ids,
    status = 'mentor_selection',
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = p_application_id;

  -- Log activity
  INSERT INTO nif_application_activity (application_id, activity_type, to_value, notes, performed_by)
  VALUES (p_application_id, 'mentor_suggested', array_to_string(p_mentor_ids, ','),
          'Admin suggested ' || array_length(p_mentor_ids, 1) || ' mentors', auth.uid());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applicant: Select a mentor from suggestions
CREATE OR REPLACE FUNCTION select_mentor(
  p_application_id UUID,
  p_mentor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_app RECORD;
BEGIN
  -- Get application
  SELECT * INTO v_app FROM nif_applications WHERE id = p_application_id;

  -- Verify ownership and status
  IF v_app.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not your application';
  END IF;

  IF v_app.status != 'mentor_selection' THEN
    RAISE EXCEPTION 'Application not in mentor selection phase';
  END IF;

  -- Verify mentor is in suggested list
  IF NOT (p_mentor_id = ANY(v_app.suggested_mentors)) THEN
    RAISE EXCEPTION 'Mentor not in suggested list';
  END IF;

  -- Update application
  UPDATE nif_applications
  SET
    selected_mentor_id = p_mentor_id,
    status = 'active'
  WHERE id = p_application_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

-- Applications with full context
CREATE OR REPLACE VIEW nif_applications_view AS
SELECT
  na.id,
  na.cycle_id,
  na.user_id,
  na.tier,
  na.startup_name,
  na.motivation,
  na.status,
  na.applied_at,
  na.reviewed_at,
  na.activated_at,
  na.suggested_mentors,
  na.selected_mentor_id,
  c.name AS cycle_name,
  u.name AS applicant_name,
  u.email AS applicant_email,
  i.name AS institution_name,
  i.short_name AS institution_short,
  p.refined_statement AS problem_statement,
  b.project_url,
  ia.total_users,
  ia.impact_score,
  m.name AS mentor_name
FROM nif_applications na
JOIN cycles c ON na.cycle_id = c.id
JOIN users u ON na.user_id = u.id
LEFT JOIN institutions i ON u.institution_id = i.id
LEFT JOIN problems p ON p.cycle_id = c.id
LEFT JOIN builds b ON b.cycle_id = c.id
LEFT JOIN impact_assessments ia ON ia.cycle_id = c.id
LEFT JOIN mentors m ON na.selected_mentor_id = m.id;

-- Mentor leaderboard
CREATE OR REPLACE VIEW mentor_activity_view AS
SELECT
  m.id,
  m.name,
  m.title,
  m.mentor_type,
  m.domains,
  m.current_mentees,
  m.max_mentees,
  COUNT(na.id) AS total_mentored,
  COUNT(CASE WHEN na.status = 'completed' THEN 1 END) AS completed_mentorships,
  COUNT(ms.id) AS total_sessions
FROM mentors m
LEFT JOIN nif_applications na ON m.id = na.selected_mentor_id
LEFT JOIN mentorship_sessions ms ON m.id = ms.mentor_id
GROUP BY m.id;

-- Add seed mentors (optional - run manually)
-- INSERT INTO mentors (name, title, mentor_type, domains, skills, bio)
-- VALUES
--   ('Dr. Example Mentor', 'Professor, JKKN Engineering', 'senior_learner',
--    ARRAY['engineering', 'ai'], ARRAY['technical', 'research'], 'Expert in AI and ML'),
--   ('Industry Expert', 'CEO, TechCorp', 'industry',
--    ARRAY['fintech', 'product'], ARRAY['fundraising', 'product'], 'Serial entrepreneur');
