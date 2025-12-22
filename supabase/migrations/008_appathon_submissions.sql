-- Appathon Submissions for Step 9
-- Stores final project submissions for Appathon competitions

-- ============================================
-- APPATHON SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appathon_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Team Information
  participation_type TEXT NOT NULL DEFAULT 'individual' CHECK (participation_type IN ('individual', 'team')),
  team_name TEXT,
  team_members JSONB DEFAULT '[]', -- Array of {name, email, institution, department, year}

  -- Applicant Details (primary submitter)
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  institution_id UUID REFERENCES institutions(id),
  department TEXT,
  year_of_study TEXT,

  -- Project Summary (some auto-filled from cycle)
  app_name TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  solution_summary TEXT,
  live_url TEXT,
  lovable_url TEXT,
  github_url TEXT,

  -- Pitch Materials
  elevator_pitch TEXT, -- max 150 words
  demo_video_url TEXT,
  screenshots JSONB DEFAULT '[]', -- Array of URLs

  -- Competition Details
  category TEXT NOT NULL CHECK (category IN ('healthcare', 'education', 'operations', 'productivity', 'other')),
  faculty_mentor TEXT,

  -- Declaration
  declaration_accepted BOOLEAN DEFAULT FALSE,
  declaration_timestamp TIMESTAMPTZ,

  -- Impact Metrics (from Step 8)
  impact_metrics JSONB DEFAULT '{}', -- {users_reached, time_saved_minutes, satisfaction_score}

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'rejected')),
  submission_number TEXT, -- Generated: APPATHON-2-0001

  -- Review fields
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  score NUMERIC(5,2),

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_submissions_cycle ON appathon_submissions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_submissions_event ON appathon_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON appathon_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON appathon_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_category ON appathon_submissions(category);
CREATE INDEX IF NOT EXISTS idx_submissions_institution ON appathon_submissions(institution_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON appathon_submissions(submitted_at);

-- ============================================
-- UNIQUE CONSTRAINTS
-- ============================================

-- One submission per cycle per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_cycle_event ON appathon_submissions(cycle_id, event_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE appathon_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON appathon_submissions;
CREATE POLICY "Users can view own submissions"
  ON appathon_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON appathon_submissions;
CREATE POLICY "Users can insert own submissions"
  ON appathon_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions (before final submission)
DROP POLICY IF EXISTS "Users can update own submissions" ON appathon_submissions;
CREATE POLICY "Users can update own submissions"
  ON appathon_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));

-- Superadmins can view all submissions
DROP POLICY IF EXISTS "Superadmins can view all submissions" ON appathon_submissions;
CREATE POLICY "Superadmins can view all submissions"
  ON appathon_submissions FOR SELECT
  USING (is_superadmin());

-- Superadmins can update all submissions (for review)
DROP POLICY IF EXISTS "Superadmins can update all submissions" ON appathon_submissions;
CREATE POLICY "Superadmins can update all submissions"
  ON appathon_submissions FOR UPDATE
  USING (is_superadmin());

-- Institution admins can view submissions from their institution
DROP POLICY IF EXISTS "Institution admins can view institution submissions" ON appathon_submissions;
CREATE POLICY "Institution admins can view institution submissions"
  ON appathon_submissions FOR SELECT
  USING (
    is_institution_admin() AND
    institution_id = get_user_institution_id()
  );

-- ============================================
-- SUBMISSION NUMBER GENERATION
-- ============================================

CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TRIGGER AS $$
DECLARE
  event_slug TEXT;
  next_num INTEGER;
BEGIN
  -- Get event slug
  SELECT slug INTO event_slug FROM events WHERE id = NEW.event_id;

  -- Get next number for this event
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(submission_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM appathon_submissions
  WHERE event_id = NEW.event_id AND submission_number IS NOT NULL;

  -- Generate submission number: APPATHON-2-0001
  NEW.submission_number := UPPER(REPLACE(event_slug, '-', '')) || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only generate number when status changes to 'submitted'
DROP TRIGGER IF EXISTS generate_submission_number_trigger ON appathon_submissions;
CREATE TRIGGER generate_submission_number_trigger
  BEFORE UPDATE ON appathon_submissions
  FOR EACH ROW
  WHEN (OLD.status = 'draft' AND NEW.status = 'submitted' AND NEW.submission_number IS NULL)
  EXECUTE FUNCTION generate_submission_number();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_appathon_submissions_updated_at ON appathon_submissions;
CREATE TRIGGER update_appathon_submissions_updated_at
  BEFORE UPDATE ON appathon_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW admin_submission_stats AS
SELECT
  e.id as event_id,
  e.slug as event_slug,
  e.name as event_name,
  COUNT(s.id) as total_submissions,
  COUNT(s.id) FILTER (WHERE s.status = 'submitted') as submitted_count,
  COUNT(s.id) FILTER (WHERE s.status = 'draft') as draft_count,
  COUNT(s.id) FILTER (WHERE s.status = 'shortlisted') as shortlisted_count,
  COUNT(s.id) FILTER (WHERE s.status = 'winner') as winner_count,
  COUNT(DISTINCT s.institution_id) as institutions_represented,
  COUNT(s.id) FILTER (WHERE s.participation_type = 'team') as team_submissions,
  AVG(s.score) FILTER (WHERE s.score IS NOT NULL) as avg_score
FROM events e
LEFT JOIN appathon_submissions s ON s.event_id = e.id
GROUP BY e.id, e.slug, e.name;

GRANT SELECT ON admin_submission_stats TO authenticated;

-- Submissions by institution
CREATE OR REPLACE VIEW admin_submissions_by_institution AS
SELECT
  e.slug as event_slug,
  i.name as institution_name,
  i.short_name as institution_short,
  COUNT(s.id) as submission_count,
  COUNT(s.id) FILTER (WHERE s.status = 'submitted') as submitted,
  COUNT(s.id) FILTER (WHERE s.status = 'shortlisted') as shortlisted,
  COUNT(s.id) FILTER (WHERE s.status = 'winner') as winners
FROM institutions i
CROSS JOIN events e
LEFT JOIN appathon_submissions s ON s.institution_id = i.id AND s.event_id = e.id
WHERE e.config->>'type' = 'appathon'
GROUP BY e.slug, i.id, i.name, i.short_name
ORDER BY e.slug, submission_count DESC;

GRANT SELECT ON admin_submissions_by_institution TO authenticated;
