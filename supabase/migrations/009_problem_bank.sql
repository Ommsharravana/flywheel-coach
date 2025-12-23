-- Problem Intelligence System - Layer A: Problem Repository
-- Stores validated problems from completed cycles for reuse and analysis

-- ============================================
-- LAYER A: PROBLEM BANK CORE TABLES
-- ============================================

-- Central problem bank (problems extracted from cycles or submitted directly)
CREATE TABLE IF NOT EXISTS problem_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking (where did this problem come from?)
  original_cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'cycle' CHECK (source_type IN ('cycle', 'manual', 'import', 'appathon')),
  source_year INT DEFAULT EXTRACT(YEAR FROM NOW()),
  source_event TEXT, -- 'Appathon 2.0', 'Appathon 3.0', etc.

  -- Core problem data
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  theme TEXT CHECK (theme IN ('healthcare', 'education', 'agriculture', 'environment', 'community', 'operations', 'productivity', 'other')),
  sub_theme TEXT,

  -- Context (from Context Discovery)
  who_affected TEXT,
  when_occurs TEXT,
  where_occurs TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'rarely')),
  severity_rating INT CHECK (severity_rating BETWEEN 1 AND 10),
  current_workaround TEXT,

  -- Validation status
  validation_status TEXT DEFAULT 'unvalidated' CHECK (validation_status IN (
    'unvalidated', 'user_tested', 'desperate_user_confirmed', 'market_validated'
  )),
  users_interviewed INT DEFAULT 0,
  desperate_user_count INT DEFAULT 0,
  desperate_user_score INT CHECK (desperate_user_score BETWEEN 0 AND 5),

  -- Institutional tracking
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  department TEXT,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Lifecycle
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'in_progress', 'solved', 'archived')),
  is_open_for_attempts BOOLEAN DEFAULT true,

  -- Solution reference (if solved)
  best_solution_cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  best_solution_url TEXT,

  -- Full-text searchable content
  search_content TEXT GENERATED ALWAYS AS (
    COALESCE(title, '') || ' ' || COALESCE(problem_statement, '') || ' ' || COALESCE(who_affected, '')
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Flexible metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Problem attempts (track multiple teams working on same problem)
CREATE TABLE IF NOT EXISTS problem_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Team info (if applicable)
  team_name TEXT,

  -- Outcome tracking
  outcome TEXT CHECK (outcome IN ('building', 'deployed', 'abandoned', 'success', 'partial')),
  outcome_notes TEXT,

  -- Impact (if successful)
  users_reached INT DEFAULT 0,
  impact_score INT CHECK (impact_score BETWEEN 0 AND 100),
  app_url TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One attempt per cycle per problem
  UNIQUE(problem_id, cycle_id)
);

-- Problem tags (flexible categorization)
CREATE TABLE IF NOT EXISTS problem_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tag_type TEXT DEFAULT 'custom' CHECK (tag_type IN ('theme', 'technology', 'domain', 'custom', 'auto')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- No duplicate tags per problem
  UNIQUE(problem_id, tag)
);

-- Problem evidence (interviews, testimonials, validation data)
CREATE TABLE IF NOT EXISTS problem_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Evidence type
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('interview', 'survey', 'observation', 'testimonial', 'metric', 'quote')),

  -- Content
  content TEXT NOT NULL,
  source_name TEXT, -- Anonymized user identifier
  source_role TEXT, -- e.g., "pharmacy student", "nurse"

  -- Metadata
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  collected_at TIMESTAMPTZ,
  collected_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Problem bank indexes
CREATE INDEX IF NOT EXISTS idx_problem_bank_theme ON problem_bank(theme);
CREATE INDEX IF NOT EXISTS idx_problem_bank_status ON problem_bank(status);
CREATE INDEX IF NOT EXISTS idx_problem_bank_validation ON problem_bank(validation_status);
CREATE INDEX IF NOT EXISTS idx_problem_bank_institution ON problem_bank(institution_id);
CREATE INDEX IF NOT EXISTS idx_problem_bank_submitted_by ON problem_bank(submitted_by);
CREATE INDEX IF NOT EXISTS idx_problem_bank_source_type ON problem_bank(source_type);
CREATE INDEX IF NOT EXISTS idx_problem_bank_source_year ON problem_bank(source_year);
CREATE INDEX IF NOT EXISTS idx_problem_bank_original_cycle ON problem_bank(original_cycle_id);
CREATE INDEX IF NOT EXISTS idx_problem_bank_severity ON problem_bank(severity_rating DESC);
CREATE INDEX IF NOT EXISTS idx_problem_bank_created ON problem_bank(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_problem_bank_fts ON problem_bank
  USING gin(to_tsvector('english', search_content));

-- Problem attempts indexes
CREATE INDEX IF NOT EXISTS idx_problem_attempts_problem ON problem_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_cycle ON problem_attempts(cycle_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user ON problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_outcome ON problem_attempts(outcome);

-- Problem tags indexes
CREATE INDEX IF NOT EXISTS idx_problem_tags_problem ON problem_tags(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag ON problem_tags(tag);
CREATE INDEX IF NOT EXISTS idx_problem_tags_type ON problem_tags(tag_type);

-- Problem evidence indexes
CREATE INDEX IF NOT EXISTS idx_problem_evidence_problem ON problem_evidence(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_evidence_type ON problem_evidence(evidence_type);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE problem_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_evidence ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROBLEM BANK
-- ============================================

-- Everyone can view open problems (public problem bank)
DROP POLICY IF EXISTS "Anyone can view open problems" ON problem_bank;
CREATE POLICY "Anyone can view open problems"
  ON problem_bank FOR SELECT
  USING (status IN ('open', 'claimed', 'in_progress', 'solved') OR submitted_by = auth.uid());

-- Users can insert their own problems
DROP POLICY IF EXISTS "Users can insert own problems" ON problem_bank;
CREATE POLICY "Users can insert own problems"
  ON problem_bank FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Users can update their own problems
DROP POLICY IF EXISTS "Users can update own problems" ON problem_bank;
CREATE POLICY "Users can update own problems"
  ON problem_bank FOR UPDATE
  USING (auth.uid() = submitted_by);

-- Superadmins can do everything
DROP POLICY IF EXISTS "Superadmins full access to problem_bank" ON problem_bank;
CREATE POLICY "Superadmins full access to problem_bank"
  ON problem_bank FOR ALL
  USING (is_superadmin());

-- ============================================
-- RLS POLICIES - PROBLEM ATTEMPTS
-- ============================================

-- Everyone can view attempts on open problems
DROP POLICY IF EXISTS "Anyone can view problem attempts" ON problem_attempts;
CREATE POLICY "Anyone can view problem attempts"
  ON problem_attempts FOR SELECT
  USING (
    problem_id IN (SELECT id FROM problem_bank WHERE status IN ('open', 'claimed', 'in_progress', 'solved'))
    OR user_id = auth.uid()
  );

-- Users can insert their own attempts
DROP POLICY IF EXISTS "Users can insert own attempts" ON problem_attempts;
CREATE POLICY "Users can insert own attempts"
  ON problem_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts
DROP POLICY IF EXISTS "Users can update own attempts" ON problem_attempts;
CREATE POLICY "Users can update own attempts"
  ON problem_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Superadmins can do everything
DROP POLICY IF EXISTS "Superadmins full access to problem_attempts" ON problem_attempts;
CREATE POLICY "Superadmins full access to problem_attempts"
  ON problem_attempts FOR ALL
  USING (is_superadmin());

-- ============================================
-- RLS POLICIES - PROBLEM TAGS
-- ============================================

-- Everyone can view tags
DROP POLICY IF EXISTS "Anyone can view problem tags" ON problem_tags;
CREATE POLICY "Anyone can view problem tags"
  ON problem_tags FOR SELECT
  USING (true);

-- Users can add tags to problems they submitted or attempted
DROP POLICY IF EXISTS "Users can add tags to relevant problems" ON problem_tags;
CREATE POLICY "Users can add tags to relevant problems"
  ON problem_tags FOR INSERT
  WITH CHECK (
    problem_id IN (SELECT id FROM problem_bank WHERE submitted_by = auth.uid())
    OR problem_id IN (SELECT problem_id FROM problem_attempts WHERE user_id = auth.uid())
    OR is_superadmin()
  );

-- Superadmins can do everything
DROP POLICY IF EXISTS "Superadmins full access to problem_tags" ON problem_tags;
CREATE POLICY "Superadmins full access to problem_tags"
  ON problem_tags FOR ALL
  USING (is_superadmin());

-- ============================================
-- RLS POLICIES - PROBLEM EVIDENCE
-- ============================================

-- Everyone can view evidence on open problems
DROP POLICY IF EXISTS "Anyone can view problem evidence" ON problem_evidence;
CREATE POLICY "Anyone can view problem evidence"
  ON problem_evidence FOR SELECT
  USING (
    problem_id IN (SELECT id FROM problem_bank WHERE status IN ('open', 'claimed', 'in_progress', 'solved'))
    OR collected_by = auth.uid()
  );

-- Users can add evidence
DROP POLICY IF EXISTS "Users can add evidence" ON problem_evidence;
CREATE POLICY "Users can add evidence"
  ON problem_evidence FOR INSERT
  WITH CHECK (auth.uid() = collected_by);

-- Superadmins can do everything
DROP POLICY IF EXISTS "Superadmins full access to problem_evidence" ON problem_evidence;
CREATE POLICY "Superadmins full access to problem_evidence"
  ON problem_evidence FOR ALL
  USING (is_superadmin());

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_problem_bank_updated_at ON problem_bank;
CREATE TRIGGER update_problem_bank_updated_at
  BEFORE UPDATE ON problem_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_problem_attempts_updated_at ON problem_attempts;
CREATE TRIGGER update_problem_attempts_updated_at
  BEFORE UPDATE ON problem_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to extract problem from cycle to problem bank
CREATE OR REPLACE FUNCTION extract_problem_from_cycle(p_cycle_id UUID)
RETURNS UUID AS $$
DECLARE
  v_problem_bank_id UUID;
  v_cycle RECORD;
  v_problem RECORD;
  v_context RECORD;
  v_value RECORD;
  v_user RECORD;
BEGIN
  -- Get cycle info
  SELECT * INTO v_cycle FROM cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found';
  END IF;

  -- Get problem data
  SELECT * INTO v_problem FROM problems WHERE cycle_id = p_cycle_id ORDER BY created_at DESC LIMIT 1;

  -- Get context data
  SELECT * INTO v_context FROM contexts WHERE cycle_id = p_cycle_id ORDER BY created_at DESC LIMIT 1;

  -- Get value assessment
  SELECT * INTO v_value FROM value_assessments WHERE cycle_id = p_cycle_id ORDER BY created_at DESC LIMIT 1;

  -- Get user info
  SELECT * INTO v_user FROM users WHERE id = v_cycle.user_id;

  -- Create problem bank entry
  INSERT INTO problem_bank (
    original_cycle_id,
    source_type,
    source_year,
    title,
    problem_statement,
    who_affected,
    when_occurs,
    frequency,
    severity_rating,
    current_workaround,
    validation_status,
    users_interviewed,
    desperate_user_count,
    desperate_user_score,
    institution_id,
    department,
    submitted_by
  ) VALUES (
    p_cycle_id,
    'cycle',
    EXTRACT(YEAR FROM v_cycle.created_at),
    COALESCE(v_cycle.name, v_problem.refined_statement, 'Untitled Problem'),
    COALESCE(v_problem.refined_statement, ''),
    v_context.primary_users,
    v_context.specific_trigger,
    v_problem.frequency,
    COALESCE(v_problem.pain_level, v_context.pain_level),
    v_context.current_workaround,
    CASE
      WHEN v_value.desperate_user_score >= 4 THEN 'desperate_user_confirmed'
      WHEN v_value.desperate_user_score >= 2 THEN 'user_tested'
      ELSE 'unvalidated'
    END,
    (SELECT COUNT(*) FROM interviews WHERE context_id = v_context.id),
    v_value.desperate_user_score,
    v_value.desperate_user_score,
    (SELECT institution_id FROM users WHERE id = v_cycle.user_id),
    v_user.department,
    v_cycle.user_id
  )
  RETURNING id INTO v_problem_bank_id;

  -- Create an attempt record for the original cycle
  INSERT INTO problem_attempts (
    problem_id,
    cycle_id,
    user_id,
    outcome,
    started_at
  ) VALUES (
    v_problem_bank_id,
    p_cycle_id,
    v_cycle.user_id,
    CASE v_cycle.status
      WHEN 'completed' THEN 'success'
      WHEN 'abandoned' THEN 'abandoned'
      ELSE 'building'
    END,
    v_cycle.started_at
  );

  -- Copy interviews as evidence
  INSERT INTO problem_evidence (
    problem_id,
    evidence_type,
    content,
    source_name,
    source_role,
    pain_level,
    collected_at,
    collected_by
  )
  SELECT
    v_problem_bank_id,
    'interview',
    i.key_quote,
    i.interviewee_name,
    i.interviewee_role,
    i.pain_level,
    i.conducted_at,
    v_cycle.user_id
  FROM interviews i
  JOIN contexts c ON i.context_id = c.id
  WHERE c.cycle_id = p_cycle_id
    AND i.key_quote IS NOT NULL;

  RETURN v_problem_bank_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Problem bank statistics
CREATE OR REPLACE VIEW problem_bank_stats AS
SELECT
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE status = 'open') as open_problems,
  COUNT(*) FILTER (WHERE status = 'solved') as solved_problems,
  COUNT(*) FILTER (WHERE validation_status = 'desperate_user_confirmed') as validated_problems,
  COUNT(DISTINCT institution_id) as institutions_represented,
  COUNT(DISTINCT theme) as themes_covered,
  AVG(severity_rating) FILTER (WHERE severity_rating IS NOT NULL) as avg_severity,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as problems_last_30_days
FROM problem_bank;

GRANT SELECT ON problem_bank_stats TO authenticated;

-- Problems by theme
CREATE OR REPLACE VIEW problems_by_theme AS
SELECT
  theme,
  COUNT(*) as problem_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'solved') as solved_count,
  AVG(severity_rating) FILTER (WHERE severity_rating IS NOT NULL) as avg_severity,
  COUNT(DISTINCT institution_id) as institutions
FROM problem_bank
WHERE theme IS NOT NULL
GROUP BY theme
ORDER BY problem_count DESC;

GRANT SELECT ON problems_by_theme TO authenticated;

-- Problems by institution
CREATE OR REPLACE VIEW problems_by_institution AS
SELECT
  i.id as institution_id,
  i.name as institution_name,
  i.short_name,
  COUNT(pb.id) as problem_count,
  COUNT(pb.id) FILTER (WHERE pb.status = 'open') as open_count,
  COUNT(pb.id) FILTER (WHERE pb.validation_status = 'desperate_user_confirmed') as validated_count,
  COUNT(DISTINCT pb.theme) as themes_covered
FROM institutions i
LEFT JOIN problem_bank pb ON pb.institution_id = i.id
GROUP BY i.id, i.name, i.short_name
ORDER BY problem_count DESC;

GRANT SELECT ON problems_by_institution TO authenticated;

-- Attempt success rates
CREATE OR REPLACE VIEW problem_attempt_stats AS
SELECT
  pb.id as problem_id,
  pb.title,
  pb.theme,
  COUNT(pa.id) as total_attempts,
  COUNT(pa.id) FILTER (WHERE pa.outcome = 'success') as successful_attempts,
  COUNT(pa.id) FILTER (WHERE pa.outcome = 'abandoned') as abandoned_attempts,
  AVG(pa.impact_score) FILTER (WHERE pa.impact_score IS NOT NULL) as avg_impact_score,
  MAX(pa.users_reached) as max_users_reached
FROM problem_bank pb
LEFT JOIN problem_attempts pa ON pa.problem_id = pb.id
GROUP BY pb.id, pb.title, pb.theme
ORDER BY total_attempts DESC;

GRANT SELECT ON problem_attempt_stats TO authenticated;

-- Hot problems (multiple independent identifications)
CREATE OR REPLACE VIEW hot_problems AS
SELECT
  pb.theme,
  pb.sub_theme,
  COUNT(*) as problem_count,
  COUNT(DISTINCT pb.institution_id) as institutions_identifying,
  AVG(pb.severity_rating) as avg_severity,
  ARRAY_AGG(DISTINCT pb.title) as problem_titles
FROM problem_bank pb
WHERE pb.created_at > NOW() - INTERVAL '90 days'
GROUP BY pb.theme, pb.sub_theme
HAVING COUNT(*) >= 2 OR COUNT(DISTINCT pb.institution_id) >= 2
ORDER BY problem_count DESC, avg_severity DESC;

GRANT SELECT ON hot_problems TO authenticated;
