-- ============================================
-- LAYER C: INNOVATION PIPELINE
-- Problem → Startup tracking, quality scoring, industry engagement
-- ============================================

-- ============================================
-- Problem Scoring (for prioritization)
-- ============================================
CREATE TABLE IF NOT EXISTS problem_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Scoring dimensions (1-10 scale)
  severity_score INT CHECK (severity_score BETWEEN 1 AND 10),
  validation_score INT CHECK (validation_score BETWEEN 1 AND 10),
  uniqueness_score INT CHECK (uniqueness_score BETWEEN 1 AND 10),
  feasibility_score INT CHECK (feasibility_score BETWEEN 1 AND 10),
  impact_potential_score INT CHECK (impact_potential_score BETWEEN 1 AND 10),

  -- Computed composite score (average of all dimensions)
  composite_score FLOAT GENERATED ALWAYS AS (
    COALESCE(
      (COALESCE(severity_score, 0) + COALESCE(validation_score, 0) +
       COALESCE(uniqueness_score, 0) + COALESCE(feasibility_score, 0) +
       COALESCE(impact_potential_score, 0)) /
      NULLIF(
        (CASE WHEN severity_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN validation_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN uniqueness_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN feasibility_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN impact_potential_score IS NOT NULL THEN 1 ELSE 0 END), 0
      ),
      0
    )
  ) STORED,

  -- Scoring metadata
  scored_by TEXT NOT NULL DEFAULT 'manual', -- ai, judge, mentor, manual
  scored_by_user UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(problem_id, scored_by, scored_by_user)
);

-- ============================================
-- NIF Pipeline Candidates
-- Track problems through the NIF incubation funnel
-- ============================================
CREATE TABLE IF NOT EXISTS nif_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Pipeline stage
  stage TEXT NOT NULL DEFAULT 'identified',
  -- Stages: identified → screened → shortlisted → incubating → graduated
  -- Can also be: rejected, on_hold

  -- Tracking timestamps
  identified_by UUID REFERENCES auth.users(id),
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  screened_at TIMESTAMPTZ,
  screened_by UUID REFERENCES auth.users(id),
  shortlisted_at TIMESTAMPTZ,
  shortlisted_by UUID REFERENCES auth.users(id),
  incubation_started_at TIMESTAMPTZ,
  graduated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Decision tracking
  decision_notes TEXT,
  rejection_reason TEXT,

  -- If progresses to startup
  startup_name TEXT,
  startup_status TEXT, -- ideation, mvp, launched, funded, acquired
  startup_website TEXT,
  team_members JSONB DEFAULT '[]'::jsonb,

  -- Funding info
  funding_stage TEXT, -- pre-seed, seed, series-a, etc.
  funding_amount DECIMAL(15, 2),
  funding_currency TEXT DEFAULT 'INR',

  -- Metrics
  jobs_created INT DEFAULT 0,
  revenue_generated DECIMAL(15, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(problem_id)
);

-- ============================================
-- Industry Partner Interests
-- Track industry engagement with problems
-- ============================================
CREATE TABLE IF NOT EXISTS industry_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Partner info
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL DEFAULT 'company', -- company, ngo, government, research, individual
  partner_website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Interest tracking
  interest_level TEXT NOT NULL DEFAULT 'browsing', -- browsing, interested, committed, sponsoring
  interest_notes TEXT,

  -- Engagement
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  meetings_count INT DEFAULT 0,

  -- If sponsoring
  sponsorship_type TEXT, -- funding, mentorship, resources, hiring
  sponsorship_value DECIMAL(15, 2),
  sponsorship_currency TEXT DEFAULT 'INR',

  -- Status
  status TEXT DEFAULT 'active', -- active, paused, completed, withdrawn

  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Research Topics
-- Generate research opportunities from problems
-- ============================================
CREATE TABLE IF NOT EXISTS research_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (can be from a single problem or a cluster)
  problem_id UUID REFERENCES problem_bank(id) ON DELETE SET NULL,
  cluster_id UUID REFERENCES problem_clusters(id) ON DELETE SET NULL,

  -- Topic details
  title TEXT NOT NULL,
  abstract TEXT,
  research_type TEXT NOT NULL DEFAULT 'project', -- thesis, paper, project, grant

  -- Disciplines involved
  primary_discipline TEXT,
  secondary_disciplines TEXT[],

  -- Suggested methodology
  methodology_notes TEXT,
  expected_outcomes TEXT,
  potential_impact TEXT,

  -- Source of suggestion
  suggested_by TEXT NOT NULL DEFAULT 'manual', -- ai, faculty, industry, manual
  suggested_by_user UUID REFERENCES auth.users(id),

  -- Claim tracking
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  claim_institution_id UUID REFERENCES institutions(id),

  -- Progress
  status TEXT DEFAULT 'open', -- open, claimed, in_progress, completed, published, abandoned

  -- If completed/published
  publication_title TEXT,
  publication_venue TEXT, -- journal, conference, etc.
  publication_url TEXT,
  publication_date DATE,
  doi TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (problem_id IS NOT NULL OR cluster_id IS NOT NULL)
);

-- ============================================
-- Pipeline Stage History
-- Track all stage transitions for audit
-- ============================================
CREATE TABLE IF NOT EXISTS nif_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES nif_candidates(id) ON DELETE CASCADE,

  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_problem_scores_problem ON problem_scores(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_scores_composite ON problem_scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_nif_candidates_stage ON nif_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_nif_candidates_problem ON nif_candidates(problem_id);
CREATE INDEX IF NOT EXISTS idx_industry_interests_problem ON industry_interests(problem_id);
CREATE INDEX IF NOT EXISTS idx_industry_interests_level ON industry_interests(interest_level);
CREATE INDEX IF NOT EXISTS idx_research_topics_status ON research_topics(status);
CREATE INDEX IF NOT EXISTS idx_research_topics_problem ON research_topics(problem_id);
CREATE INDEX IF NOT EXISTS idx_research_topics_cluster ON research_topics(cluster_id);
CREATE INDEX IF NOT EXISTS idx_nif_stage_history_candidate ON nif_stage_history(candidate_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE problem_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE nif_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nif_stage_history ENABLE ROW LEVEL SECURITY;

-- Problem Scores: Anyone can view, superadmins can manage
DROP POLICY IF EXISTS "Anyone can view problem scores" ON problem_scores;
CREATE POLICY "Anyone can view problem scores" ON problem_scores
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to scores" ON problem_scores;
CREATE POLICY "Superadmins full access to scores" ON problem_scores
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- NIF Candidates: Anyone can view, superadmins can manage
DROP POLICY IF EXISTS "Anyone can view NIF candidates" ON nif_candidates;
CREATE POLICY "Anyone can view NIF candidates" ON nif_candidates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to NIF candidates" ON nif_candidates;
CREATE POLICY "Superadmins full access to NIF candidates" ON nif_candidates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Industry Interests: Anyone can view, superadmins can manage
DROP POLICY IF EXISTS "Anyone can view industry interests" ON industry_interests;
CREATE POLICY "Anyone can view industry interests" ON industry_interests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to industry interests" ON industry_interests;
CREATE POLICY "Superadmins full access to industry interests" ON industry_interests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Research Topics: Anyone can view, faculty/superadmins can claim
DROP POLICY IF EXISTS "Anyone can view research topics" ON research_topics;
CREATE POLICY "Anyone can view research topics" ON research_topics
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can claim open research topics" ON research_topics;
CREATE POLICY "Users can claim open research topics" ON research_topics
  FOR UPDATE TO authenticated
  USING (status = 'open' AND claimed_by IS NULL)
  WITH CHECK (claimed_by = auth.uid());

DROP POLICY IF EXISTS "Superadmins full access to research topics" ON research_topics;
CREATE POLICY "Superadmins full access to research topics" ON research_topics
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Stage History: Anyone can view, system inserts via trigger
DROP POLICY IF EXISTS "Anyone can view stage history" ON nif_stage_history;
CREATE POLICY "Anyone can view stage history" ON nif_stage_history
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmins full access to stage history" ON nif_stage_history;
CREATE POLICY "Superadmins full access to stage history" ON nif_stage_history
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_layer_c_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS problem_scores_updated_at ON problem_scores;
CREATE TRIGGER problem_scores_updated_at
  BEFORE UPDATE ON problem_scores
  FOR EACH ROW EXECUTE FUNCTION update_layer_c_updated_at();

DROP TRIGGER IF EXISTS nif_candidates_updated_at ON nif_candidates;
CREATE TRIGGER nif_candidates_updated_at
  BEFORE UPDATE ON nif_candidates
  FOR EACH ROW EXECUTE FUNCTION update_layer_c_updated_at();

DROP TRIGGER IF EXISTS industry_interests_updated_at ON industry_interests;
CREATE TRIGGER industry_interests_updated_at
  BEFORE UPDATE ON industry_interests
  FOR EACH ROW EXECUTE FUNCTION update_layer_c_updated_at();

DROP TRIGGER IF EXISTS research_topics_updated_at ON research_topics;
CREATE TRIGGER research_topics_updated_at
  BEFORE UPDATE ON research_topics
  FOR EACH ROW EXECUTE FUNCTION update_layer_c_updated_at();

-- Track NIF stage changes
CREATE OR REPLACE FUNCTION track_nif_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO nif_stage_history (candidate_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());

    -- Update timestamp based on new stage
    CASE NEW.stage
      WHEN 'screened' THEN NEW.screened_at = NOW();
      WHEN 'shortlisted' THEN NEW.shortlisted_at = NOW();
      WHEN 'incubating' THEN NEW.incubation_started_at = NOW();
      WHEN 'graduated' THEN NEW.graduated_at = NOW();
      WHEN 'rejected' THEN NEW.rejected_at = NOW();
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS nif_stage_change_tracker ON nif_candidates;
CREATE TRIGGER nif_stage_change_tracker
  BEFORE UPDATE ON nif_candidates
  FOR EACH ROW EXECUTE FUNCTION track_nif_stage_change();

-- ============================================
-- VIEWS
-- ============================================

-- Pipeline overview with problem details
CREATE OR REPLACE VIEW nif_pipeline_view AS
SELECT
  nc.id,
  nc.problem_id,
  pb.title AS problem_title,
  pb.problem_statement,
  pb.theme,
  pb.validation_status,
  i.name AS institution_name,
  i.short_name AS institution_short,
  nc.stage,
  nc.startup_name,
  nc.startup_status,
  nc.funding_stage,
  nc.funding_amount,
  nc.jobs_created,
  nc.revenue_generated,
  nc.identified_at,
  nc.screened_at,
  nc.shortlisted_at,
  nc.incubation_started_at,
  nc.graduated_at,
  ps.composite_score,
  nc.created_at,
  nc.updated_at
FROM nif_candidates nc
JOIN problem_bank pb ON nc.problem_id = pb.id
LEFT JOIN institutions i ON pb.institution_id = i.id
LEFT JOIN problem_scores ps ON pb.id = ps.problem_id;

-- Top-scored problems not yet in pipeline
CREATE OR REPLACE VIEW high_potential_problems AS
SELECT
  pb.id,
  pb.title,
  pb.problem_statement,
  pb.theme,
  pb.validation_status,
  i.short_name AS institution_short,
  ps.composite_score,
  ps.severity_score,
  ps.validation_score,
  ps.uniqueness_score,
  ps.feasibility_score,
  ps.impact_potential_score,
  pb.created_at
FROM problem_bank pb
LEFT JOIN problem_scores ps ON pb.id = ps.problem_id
LEFT JOIN institutions i ON pb.institution_id = i.id
WHERE pb.status = 'open'
  AND NOT EXISTS (
    SELECT 1 FROM nif_candidates nc WHERE nc.problem_id = pb.id
  )
ORDER BY ps.composite_score DESC NULLS LAST;

-- Research topics with context
CREATE OR REPLACE VIEW research_topics_view AS
SELECT
  rt.id,
  rt.title,
  rt.abstract,
  rt.research_type,
  rt.primary_discipline,
  rt.status,
  rt.suggested_by,
  pb.title AS problem_title,
  pb.theme AS problem_theme,
  pc.name AS cluster_name,
  u.name AS claimed_by_name,
  i.short_name AS claim_institution,
  rt.publication_title,
  rt.publication_venue,
  rt.publication_date,
  rt.created_at
FROM research_topics rt
LEFT JOIN problem_bank pb ON rt.problem_id = pb.id
LEFT JOIN problem_clusters pc ON rt.cluster_id = pc.id
LEFT JOIN users u ON rt.claimed_by = u.id
LEFT JOIN institutions i ON rt.claim_institution_id = i.id;

-- Industry engagement summary
CREATE OR REPLACE VIEW industry_engagement_summary AS
SELECT
  pb.id AS problem_id,
  pb.title AS problem_title,
  pb.theme,
  COUNT(ii.id) AS total_interests,
  COUNT(CASE WHEN ii.interest_level = 'sponsoring' THEN 1 END) AS sponsors,
  COUNT(CASE WHEN ii.interest_level = 'committed' THEN 1 END) AS committed,
  COUNT(CASE WHEN ii.interest_level = 'interested' THEN 1 END) AS interested,
  SUM(COALESCE(ii.sponsorship_value, 0)) AS total_sponsorship_value,
  MAX(ii.last_contact_at) AS last_engagement
FROM problem_bank pb
LEFT JOIN industry_interests ii ON pb.id = ii.problem_id AND ii.status = 'active'
GROUP BY pb.id, pb.title, pb.theme;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Add problem to NIF pipeline
CREATE OR REPLACE FUNCTION add_to_nif_pipeline(
  p_problem_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_candidate_id UUID;
BEGIN
  INSERT INTO nif_candidates (problem_id, identified_by, decision_notes)
  VALUES (p_problem_id, auth.uid(), p_notes)
  ON CONFLICT (problem_id) DO NOTHING
  RETURNING id INTO v_candidate_id;

  RETURN v_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Advance NIF candidate to next stage
CREATE OR REPLACE FUNCTION advance_nif_stage(
  p_candidate_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_current_stage TEXT;
  v_next_stage TEXT;
BEGIN
  SELECT stage INTO v_current_stage FROM nif_candidates WHERE id = p_candidate_id;

  v_next_stage := CASE v_current_stage
    WHEN 'identified' THEN 'screened'
    WHEN 'screened' THEN 'shortlisted'
    WHEN 'shortlisted' THEN 'incubating'
    WHEN 'incubating' THEN 'graduated'
    ELSE v_current_stage
  END;

  UPDATE nif_candidates
  SET stage = v_next_stage, decision_notes = COALESCE(p_notes, decision_notes)
  WHERE id = p_candidate_id;

  RETURN v_next_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Score a problem
CREATE OR REPLACE FUNCTION score_problem(
  p_problem_id UUID,
  p_severity INT DEFAULT NULL,
  p_validation INT DEFAULT NULL,
  p_uniqueness INT DEFAULT NULL,
  p_feasibility INT DEFAULT NULL,
  p_impact INT DEFAULT NULL,
  p_scored_by TEXT DEFAULT 'manual',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_score_id UUID;
BEGIN
  INSERT INTO problem_scores (
    problem_id,
    severity_score,
    validation_score,
    uniqueness_score,
    feasibility_score,
    impact_potential_score,
    scored_by,
    scored_by_user,
    notes
  )
  VALUES (
    p_problem_id,
    p_severity,
    p_validation,
    p_uniqueness,
    p_feasibility,
    p_impact,
    p_scored_by,
    auth.uid(),
    p_notes
  )
  ON CONFLICT (problem_id, scored_by, scored_by_user) DO UPDATE SET
    severity_score = COALESCE(EXCLUDED.severity_score, problem_scores.severity_score),
    validation_score = COALESCE(EXCLUDED.validation_score, problem_scores.validation_score),
    uniqueness_score = COALESCE(EXCLUDED.uniqueness_score, problem_scores.uniqueness_score),
    feasibility_score = COALESCE(EXCLUDED.feasibility_score, problem_scores.feasibility_score),
    impact_potential_score = COALESCE(EXCLUDED.impact_potential_score, problem_scores.impact_potential_score),
    notes = COALESCE(EXCLUDED.notes, problem_scores.notes),
    updated_at = NOW()
  RETURNING id INTO v_score_id;

  RETURN v_score_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate research topic from problem
CREATE OR REPLACE FUNCTION generate_research_topic(
  p_problem_id UUID,
  p_title TEXT,
  p_abstract TEXT DEFAULT NULL,
  p_research_type TEXT DEFAULT 'project',
  p_discipline TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_topic_id UUID;
BEGIN
  INSERT INTO research_topics (
    problem_id,
    title,
    abstract,
    research_type,
    primary_discipline,
    suggested_by,
    suggested_by_user
  )
  VALUES (
    p_problem_id,
    p_title,
    p_abstract,
    p_research_type,
    p_discipline,
    'manual',
    auth.uid()
  )
  RETURNING id INTO v_topic_id;

  RETURN v_topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
