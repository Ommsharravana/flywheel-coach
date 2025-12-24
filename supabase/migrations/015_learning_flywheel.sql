-- ============================================
-- LAYER D: LEARNING FLYWHEEL
-- ============================================
-- Problem outcomes, AI refinements, case studies
-- The system that learns and improves over time

-- ============================================
-- PROBLEM OUTCOMES
-- ============================================
-- Track what happened when problems were solved

CREATE TABLE IF NOT EXISTS problem_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES problem_attempts(id) ON DELETE SET NULL,

  -- Outcome classification
  outcome_type VARCHAR(30) NOT NULL CHECK (outcome_type IN (
    'success',        -- Problem fully solved, solution deployed
    'partial',        -- Partially solved, some impact achieved
    'pivot',          -- Problem understanding changed, pivoted
    'abandoned',      -- Attempt stopped without resolution
    'ongoing'         -- Still being worked on
  )),
  outcome_description TEXT,

  -- Success metrics
  time_to_solution_days INT,
  iterations_count INT DEFAULT 1,
  user_adoption_rate FLOAT CHECK (user_adoption_rate >= 0 AND user_adoption_rate <= 1),
  satisfaction_score FLOAT CHECK (satisfaction_score >= 0 AND satisfaction_score <= 10),

  -- Impact metrics
  users_impacted INT DEFAULT 0,
  time_saved_hours FLOAT DEFAULT 0,
  cost_saved DECIMAL(12, 2) DEFAULT 0,
  revenue_generated DECIMAL(12, 2) DEFAULT 0,

  -- Learnings
  what_worked TEXT,
  what_didnt_work TEXT,
  key_insights TEXT[],
  recommendations TEXT[],

  -- Metadata
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(problem_id, attempt_id)
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_problem_outcomes_type ON problem_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_problem_outcomes_problem ON problem_outcomes(problem_id);

-- ============================================
-- AI REFINEMENT SUGGESTIONS
-- ============================================
-- AI-suggested improvements to problem statements

CREATE TABLE IF NOT EXISTS ai_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Original vs suggested
  original_statement TEXT NOT NULL,
  suggested_statement TEXT NOT NULL,
  refinement_type VARCHAR(30) NOT NULL CHECK (refinement_type IN (
    'clarity',        -- Make problem clearer
    'scope',          -- Narrow or expand scope
    'user_focus',     -- Better define affected users
    'validation',     -- Add validation suggestions
    'feasibility',    -- Suggest more feasible framing
    'impact',         -- Highlight impact potential
    'general'         -- General improvement
  )),
  refinement_reason TEXT,

  -- AI confidence
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Based on what data
  based_on VARCHAR(50) CHECK (based_on IN (
    'similar_successes',  -- Based on successful similar problems
    'user_feedback',      -- Based on user feedback patterns
    'outcome_patterns',   -- Based on outcome analysis
    'cluster_analysis',   -- Based on problem cluster insights
    'industry_input'      -- Based on industry partner feedback
  )),
  source_problem_ids UUID[],  -- Problems that informed this suggestion

  -- User response
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Not yet reviewed
    'accepted',   -- User accepted suggestion
    'rejected',   -- User rejected suggestion
    'modified'    -- User made different change
  )),
  user_response_notes TEXT,
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate suggestions for same problem
  UNIQUE(problem_id, suggested_statement)
);

-- Index for pending reviews
CREATE INDEX IF NOT EXISTS idx_ai_refinements_status ON ai_refinements(status);
CREATE INDEX IF NOT EXISTS idx_ai_refinements_problem ON ai_refinements(problem_id);

-- ============================================
-- CASE STUDIES
-- ============================================
-- Generated case studies from successful problems

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES problem_attempts(id) ON DELETE SET NULL,
  outcome_id UUID REFERENCES problem_outcomes(id) ON DELETE SET NULL,

  -- Content
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) UNIQUE,
  summary TEXT,
  full_content TEXT,

  -- Structured sections (for template generation)
  section_problem TEXT,
  section_context TEXT,
  section_approach TEXT,
  section_solution TEXT,
  section_implementation TEXT,
  section_impact TEXT,
  section_lessons TEXT,
  section_recommendations TEXT,

  -- Categorization
  theme VARCHAR(50),
  tags TEXT[],
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN (
    'beginner',
    'intermediate',
    'advanced'
  )),

  -- Teaching value
  learning_objectives TEXT[],
  key_takeaways TEXT[],
  discussion_questions TEXT[],

  -- Media
  featured_image_url TEXT,
  media_urls TEXT[],

  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'under_review',
    'approved',
    'published',
    'archived'
  )),
  published_at TIMESTAMP,

  -- Authorship
  generated_by VARCHAR(20) CHECK (generated_by IN ('ai', 'manual', 'hybrid')),
  reviewed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  -- Metrics
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  share_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for public browsing
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_theme ON case_studies(theme);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(published_at DESC);

-- ============================================
-- LEARNING PATTERNS
-- ============================================
-- Aggregated patterns learned from outcomes

CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN (
    'success_factor',     -- What leads to success
    'failure_warning',    -- What leads to failure
    'optimal_approach',   -- Best practices
    'common_mistake',     -- What to avoid
    'time_estimator',     -- How long things take
    'resource_predictor'  -- What resources are needed
  )),

  -- Pattern details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  conditions JSONB,  -- When this pattern applies

  -- Evidence
  supporting_outcomes INT DEFAULT 0,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sample_problem_ids UUID[],

  -- Applicability
  applicable_themes TEXT[],
  applicable_stages TEXT[],  -- NIF stages

  -- Recommendations
  action_items TEXT[],

  -- Metadata
  discovered_at TIMESTAMP DEFAULT NOW(),
  last_validated TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_active ON learning_patterns(is_active);

-- ============================================
-- FLYWHEEL METRICS
-- ============================================
-- Track system improvement over time

CREATE TABLE IF NOT EXISTS flywheel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  )),

  -- Problem metrics
  problems_submitted INT DEFAULT 0,
  problems_validated INT DEFAULT 0,
  problems_in_pipeline INT DEFAULT 0,

  -- Outcome metrics
  outcomes_success INT DEFAULT 0,
  outcomes_partial INT DEFAULT 0,
  outcomes_abandoned INT DEFAULT 0,
  avg_time_to_solution FLOAT,

  -- AI metrics
  refinements_suggested INT DEFAULT 0,
  refinements_accepted INT DEFAULT 0,
  refinement_acceptance_rate FLOAT,

  -- Case study metrics
  case_studies_generated INT DEFAULT 0,
  case_studies_published INT DEFAULT 0,
  case_study_views INT DEFAULT 0,

  -- Impact metrics
  total_users_impacted INT DEFAULT 0,
  total_time_saved_hours FLOAT DEFAULT 0,
  total_revenue_generated DECIMAL(14, 2) DEFAULT 0,

  -- Learning metrics
  patterns_discovered INT DEFAULT 0,
  patterns_validated INT DEFAULT 0,

  -- Computed at
  computed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(period_start, period_end, period_type)
);

CREATE INDEX IF NOT EXISTS idx_flywheel_metrics_period ON flywheel_metrics(period_type, period_start DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE problem_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE flywheel_metrics ENABLE ROW LEVEL SECURITY;

-- Problem Outcomes: Anyone can view, superadmins can manage
DROP POLICY IF EXISTS "Anyone can view problem outcomes" ON problem_outcomes;
CREATE POLICY "Anyone can view problem outcomes" ON problem_outcomes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to outcomes" ON problem_outcomes;
CREATE POLICY "Superadmins full access to outcomes" ON problem_outcomes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- AI Refinements: Users see their problems' refinements, superadmins see all
DROP POLICY IF EXISTS "Users view own problem refinements" ON ai_refinements;
CREATE POLICY "Users view own problem refinements" ON ai_refinements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problem_bank pb
      WHERE pb.id = ai_refinements.problem_id
      AND pb.submitted_by = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Users respond to own refinements" ON ai_refinements;
CREATE POLICY "Users respond to own refinements" ON ai_refinements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problem_bank pb
      WHERE pb.id = ai_refinements.problem_id
      AND pb.submitted_by = auth.uid()
    )
  )
  WITH CHECK (responded_by = auth.uid());

DROP POLICY IF EXISTS "Superadmins full access to refinements" ON ai_refinements;
CREATE POLICY "Superadmins full access to refinements" ON ai_refinements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Case Studies: Published visible to all, drafts to superadmins
DROP POLICY IF EXISTS "Published case studies visible to all" ON case_studies;
CREATE POLICY "Published case studies visible to all" ON case_studies
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Superadmins full access to case studies" ON case_studies;
CREATE POLICY "Superadmins full access to case studies" ON case_studies
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Learning Patterns: Active patterns visible to all
DROP POLICY IF EXISTS "Active patterns visible to all" ON learning_patterns;
CREATE POLICY "Active patterns visible to all" ON learning_patterns
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Superadmins full access to patterns" ON learning_patterns;
CREATE POLICY "Superadmins full access to patterns" ON learning_patterns
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Flywheel Metrics: Anyone can view
DROP POLICY IF EXISTS "Anyone can view flywheel metrics" ON flywheel_metrics;
CREATE POLICY "Anyone can view flywheel metrics" ON flywheel_metrics
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to metrics" ON flywheel_metrics;
CREATE POLICY "Superadmins full access to metrics" ON flywheel_metrics
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_layer_d_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS problem_outcomes_updated_at ON problem_outcomes;
CREATE TRIGGER problem_outcomes_updated_at
  BEFORE UPDATE ON problem_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_layer_d_updated_at();

DROP TRIGGER IF EXISTS case_studies_updated_at ON case_studies;
CREATE TRIGGER case_studies_updated_at
  BEFORE UPDATE ON case_studies
  FOR EACH ROW EXECUTE FUNCTION update_layer_d_updated_at();

-- Auto-generate case study slug
CREATE OR REPLACE FUNCTION generate_case_study_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- Ensure uniqueness
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM case_studies WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS case_studies_slug_generator ON case_studies;
CREATE TRIGGER case_studies_slug_generator
  BEFORE INSERT OR UPDATE OF title ON case_studies
  FOR EACH ROW EXECUTE FUNCTION generate_case_study_slug();

-- ============================================
-- VIEWS
-- ============================================

-- Outcome analytics view
CREATE OR REPLACE VIEW outcome_analytics AS
SELECT
  po.outcome_type,
  pb.theme,
  i.short_name AS institution,
  COUNT(*) AS count,
  AVG(po.time_to_solution_days) AS avg_days,
  AVG(po.user_adoption_rate) AS avg_adoption,
  AVG(po.satisfaction_score) AS avg_satisfaction,
  SUM(po.users_impacted) AS total_users_impacted,
  SUM(po.time_saved_hours) AS total_hours_saved,
  SUM(po.revenue_generated) AS total_revenue
FROM problem_outcomes po
JOIN problem_bank pb ON po.problem_id = pb.id
LEFT JOIN institutions i ON pb.institution_id = i.id
GROUP BY po.outcome_type, pb.theme, i.short_name;

-- Published case studies view
CREATE OR REPLACE VIEW published_case_studies AS
SELECT
  cs.id,
  cs.title,
  cs.slug,
  cs.summary,
  cs.theme,
  cs.tags,
  cs.difficulty_level,
  cs.learning_objectives,
  cs.key_takeaways,
  cs.featured_image_url,
  cs.published_at,
  cs.view_count,
  cs.like_count,
  pb.title AS problem_title,
  i.name AS institution_name,
  i.short_name AS institution_short
FROM case_studies cs
JOIN problem_bank pb ON cs.problem_id = pb.id
LEFT JOIN institutions i ON pb.institution_id = i.id
WHERE cs.status = 'published'
ORDER BY cs.published_at DESC;

-- AI refinement effectiveness view
CREATE OR REPLACE VIEW refinement_effectiveness AS
SELECT
  refinement_type,
  based_on,
  COUNT(*) AS total_suggestions,
  COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  COUNT(*) FILTER (WHERE status = 'modified') AS modified,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  AVG(confidence_score) AS avg_confidence,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100,
    2
  ) AS acceptance_rate_pct
FROM ai_refinements
GROUP BY refinement_type, based_on;

-- Learning flywheel summary
CREATE OR REPLACE VIEW flywheel_summary AS
SELECT
  (SELECT COUNT(*) FROM problem_bank) AS total_problems,
  (SELECT COUNT(*) FROM problem_bank WHERE validation_status = 'market_validated') AS validated_problems,
  (SELECT COUNT(*) FROM nif_candidates WHERE stage NOT IN ('rejected', 'on_hold')) AS active_pipeline,
  (SELECT COUNT(*) FROM nif_candidates WHERE stage = 'graduated') AS graduated_startups,
  (SELECT COUNT(*) FROM problem_outcomes WHERE outcome_type = 'success') AS successful_outcomes,
  (SELECT COUNT(*) FROM ai_refinements WHERE status = 'accepted') AS refinements_applied,
  (SELECT COUNT(*) FROM case_studies WHERE status = 'published') AS published_case_studies,
  (SELECT COUNT(*) FROM learning_patterns WHERE is_active = true) AS active_patterns,
  (SELECT COALESCE(SUM(users_impacted), 0) FROM problem_outcomes) AS total_users_impacted,
  (SELECT COALESCE(SUM(revenue_generated), 0) FROM problem_outcomes) AS total_revenue_generated;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to compute flywheel metrics for a period
CREATE OR REPLACE FUNCTION compute_flywheel_metrics(
  p_start DATE,
  p_end DATE,
  p_type VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO flywheel_metrics (
    period_start,
    period_end,
    period_type,
    problems_submitted,
    problems_validated,
    problems_in_pipeline,
    outcomes_success,
    outcomes_partial,
    outcomes_abandoned,
    avg_time_to_solution,
    refinements_suggested,
    refinements_accepted,
    refinement_acceptance_rate,
    case_studies_generated,
    case_studies_published,
    total_users_impacted,
    total_time_saved_hours,
    total_revenue_generated,
    patterns_discovered
  )
  SELECT
    p_start,
    p_end,
    p_type,
    (SELECT COUNT(*) FROM problem_bank WHERE created_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM problem_bank WHERE validation_status = 'market_validated' AND updated_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM nif_candidates WHERE identified_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM problem_outcomes WHERE outcome_type = 'success' AND recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM problem_outcomes WHERE outcome_type = 'partial' AND recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM problem_outcomes WHERE outcome_type = 'abandoned' AND recorded_at::date BETWEEN p_start AND p_end),
    (SELECT AVG(time_to_solution_days) FROM problem_outcomes WHERE recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM ai_refinements WHERE created_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM ai_refinements WHERE status = 'accepted' AND responded_at::date BETWEEN p_start AND p_end),
    (SELECT
      CASE
        WHEN COUNT(*) FILTER (WHERE status != 'pending') = 0 THEN NULL
        ELSE COUNT(*) FILTER (WHERE status = 'accepted')::FLOAT / COUNT(*) FILTER (WHERE status != 'pending')
      END
      FROM ai_refinements WHERE responded_at::date BETWEEN p_start AND p_end
    ),
    (SELECT COUNT(*) FROM case_studies WHERE created_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM case_studies WHERE status = 'published' AND published_at::date BETWEEN p_start AND p_end),
    (SELECT COALESCE(SUM(users_impacted), 0) FROM problem_outcomes WHERE recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COALESCE(SUM(time_saved_hours), 0) FROM problem_outcomes WHERE recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COALESCE(SUM(revenue_generated), 0) FROM problem_outcomes WHERE recorded_at::date BETWEEN p_start AND p_end),
    (SELECT COUNT(*) FROM learning_patterns WHERE discovered_at::date BETWEEN p_start AND p_end)
  ON CONFLICT (period_start, period_end, period_type)
  DO UPDATE SET
    problems_submitted = EXCLUDED.problems_submitted,
    problems_validated = EXCLUDED.problems_validated,
    problems_in_pipeline = EXCLUDED.problems_in_pipeline,
    outcomes_success = EXCLUDED.outcomes_success,
    outcomes_partial = EXCLUDED.outcomes_partial,
    outcomes_abandoned = EXCLUDED.outcomes_abandoned,
    avg_time_to_solution = EXCLUDED.avg_time_to_solution,
    refinements_suggested = EXCLUDED.refinements_suggested,
    refinements_accepted = EXCLUDED.refinements_accepted,
    refinement_acceptance_rate = EXCLUDED.refinement_acceptance_rate,
    case_studies_generated = EXCLUDED.case_studies_generated,
    case_studies_published = EXCLUDED.case_studies_published,
    total_users_impacted = EXCLUDED.total_users_impacted,
    total_time_saved_hours = EXCLUDED.total_time_saved_hours,
    total_revenue_generated = EXCLUDED.total_revenue_generated,
    patterns_discovered = EXCLUDED.patterns_discovered,
    computed_at = NOW()
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE problem_outcomes IS 'Tracks outcomes when problems are solved - success metrics, learnings, impact';
COMMENT ON TABLE ai_refinements IS 'AI-suggested improvements to problem statements based on patterns';
COMMENT ON TABLE case_studies IS 'Generated case studies from successful problem resolutions';
COMMENT ON TABLE learning_patterns IS 'Aggregated patterns learned from outcomes to improve future work';
COMMENT ON TABLE flywheel_metrics IS 'Periodic metrics tracking system improvement over time';
