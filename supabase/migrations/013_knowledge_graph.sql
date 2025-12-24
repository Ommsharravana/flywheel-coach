-- Problem Intelligence System - Layer B: Knowledge Graph
-- AI-powered problem linking, clustering, and pattern detection

-- ============================================
-- LAYER B: KNOWLEDGE GRAPH TABLES
-- ============================================

-- Problem similarities (AI-computed or keyword-based)
CREATE TABLE IF NOT EXISTS problem_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id_a UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,
  problem_id_b UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Similarity metrics
  similarity_score FLOAT NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  similarity_type TEXT DEFAULT 'keyword' CHECK (similarity_type IN (
    'keyword',      -- Simple keyword/theme matching
    'semantic',     -- AI embedding-based similarity
    'theme',        -- Same theme cluster
    'solution',     -- Similar solution approaches
    'manual'        -- Admin-linked
  )),

  -- Computation metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  algorithm_version TEXT DEFAULT 'v1',

  -- Ensure unique pairs (order-independent)
  UNIQUE(problem_id_a, problem_id_b),
  CHECK (problem_id_a < problem_id_b) -- Canonical ordering
);

-- Problem clusters (groups of related problems)
CREATE TABLE IF NOT EXISTS problem_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cluster identity
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,

  -- Theme alignment
  primary_theme TEXT CHECK (primary_theme IN (
    'healthcare', 'education', 'agriculture', 'environment',
    'community', 'operations', 'productivity', 'myjkkn', 'other'
  )),

  -- Metrics (auto-computed)
  problem_count INT DEFAULT 0,
  avg_severity FLOAT,
  avg_validation_score FLOAT,

  -- Cross-institutional insights
  cross_institutional BOOLEAN DEFAULT false,
  institutions_count INT DEFAULT 0,

  -- Cluster status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'merged', 'archived')),
  merged_into_id UUID REFERENCES problem_clusters(id),

  -- AI-computed insights
  ai_summary TEXT,
  key_patterns TEXT[],
  suggested_actions TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Problem cluster membership
CREATE TABLE IF NOT EXISTS problem_cluster_members (
  cluster_id UUID NOT NULL REFERENCES problem_clusters(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Membership strength
  membership_score FLOAT DEFAULT 1.0 CHECK (membership_score BETWEEN 0 AND 1),
  is_centroid BOOLEAN DEFAULT false, -- Representative problem

  -- How was this membership determined?
  added_by TEXT DEFAULT 'auto' CHECK (added_by IN ('auto', 'manual', 'ai')),
  added_by_user UUID REFERENCES users(id),

  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (cluster_id, problem_id)
);

-- Problem evolution (how framing improves over iterations)
CREATE TABLE IF NOT EXISTS problem_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE,

  -- Version tracking
  version INT NOT NULL,

  -- Change details
  previous_title TEXT,
  new_title TEXT,
  previous_statement TEXT,
  new_statement TEXT,

  -- What changed?
  change_type TEXT CHECK (change_type IN (
    'title_update',
    'statement_update',
    'context_added',
    'validation_improved',
    'scope_refined',
    'ai_suggestion'
  )),
  change_reason TEXT,

  -- Who changed it?
  changed_by UUID REFERENCES users(id),

  -- Impact
  improvement_score FLOAT CHECK (improvement_score BETWEEN -1 AND 1), -- -1 = worse, 0 = neutral, 1 = better

  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure version order
  UNIQUE(problem_id, version)
);

-- AI embeddings for semantic similarity (optional, for future AI features)
CREATE TABLE IF NOT EXISTS problem_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problem_bank(id) ON DELETE CASCADE UNIQUE,

  -- The embedding vector (1536 dimensions for OpenAI ada-002)
  embedding FLOAT[] NOT NULL,

  -- Which model generated this?
  model TEXT DEFAULT 'keyword-hash',
  model_version TEXT DEFAULT 'v1',

  -- What content was embedded?
  content_hash TEXT, -- MD5 of embedded content for cache invalidation

  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Similarity indexes
CREATE INDEX IF NOT EXISTS idx_problem_similarities_a ON problem_similarities(problem_id_a);
CREATE INDEX IF NOT EXISTS idx_problem_similarities_b ON problem_similarities(problem_id_b);
CREATE INDEX IF NOT EXISTS idx_problem_similarities_score ON problem_similarities(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_problem_similarities_type ON problem_similarities(similarity_type);

-- Cluster indexes
CREATE INDEX IF NOT EXISTS idx_problem_clusters_theme ON problem_clusters(primary_theme);
CREATE INDEX IF NOT EXISTS idx_problem_clusters_status ON problem_clusters(status);
CREATE INDEX IF NOT EXISTS idx_problem_clusters_count ON problem_clusters(problem_count DESC);

-- Cluster member indexes
CREATE INDEX IF NOT EXISTS idx_cluster_members_cluster ON problem_cluster_members(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_members_problem ON problem_cluster_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_cluster_members_centroid ON problem_cluster_members(is_centroid) WHERE is_centroid = true;

-- Evolution indexes
CREATE INDEX IF NOT EXISTS idx_problem_evolution_problem ON problem_evolution(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_evolution_version ON problem_evolution(problem_id, version DESC);

-- Embedding index (for vector similarity if using pgvector in future)
CREATE INDEX IF NOT EXISTS idx_problem_embeddings_problem ON problem_embeddings(problem_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE problem_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Problem Similarities - readable by all authenticated users
DROP POLICY IF EXISTS "Anyone can view problem similarities" ON problem_similarities;
CREATE POLICY "Anyone can view problem similarities"
  ON problem_similarities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Superadmins full access to similarities" ON problem_similarities;
CREATE POLICY "Superadmins full access to similarities"
  ON problem_similarities FOR ALL
  USING (is_superadmin());

-- Problem Clusters - readable by all
DROP POLICY IF EXISTS "Anyone can view problem clusters" ON problem_clusters;
CREATE POLICY "Anyone can view problem clusters"
  ON problem_clusters FOR SELECT
  USING (status = 'active' OR is_superadmin());

DROP POLICY IF EXISTS "Superadmins full access to clusters" ON problem_clusters;
CREATE POLICY "Superadmins full access to clusters"
  ON problem_clusters FOR ALL
  USING (is_superadmin());

-- Cluster Members - readable by all
DROP POLICY IF EXISTS "Anyone can view cluster members" ON problem_cluster_members;
CREATE POLICY "Anyone can view cluster members"
  ON problem_cluster_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Superadmins full access to cluster members" ON problem_cluster_members;
CREATE POLICY "Superadmins full access to cluster members"
  ON problem_cluster_members FOR ALL
  USING (is_superadmin());

-- Problem Evolution - readable by all
DROP POLICY IF EXISTS "Anyone can view problem evolution" ON problem_evolution;
CREATE POLICY "Anyone can view problem evolution"
  ON problem_evolution FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add evolution for own problems" ON problem_evolution;
CREATE POLICY "Users can add evolution for own problems"
  ON problem_evolution FOR INSERT
  WITH CHECK (
    problem_id IN (SELECT id FROM problem_bank WHERE submitted_by = auth.uid())
    OR is_superadmin()
  );

DROP POLICY IF EXISTS "Superadmins full access to evolution" ON problem_evolution;
CREATE POLICY "Superadmins full access to evolution"
  ON problem_evolution FOR ALL
  USING (is_superadmin());

-- Embeddings - admin only (system use)
DROP POLICY IF EXISTS "Superadmins full access to embeddings" ON problem_embeddings;
CREATE POLICY "Superadmins full access to embeddings"
  ON problem_embeddings FOR ALL
  USING (is_superadmin());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to compute simple keyword similarity between two problems
CREATE OR REPLACE FUNCTION compute_keyword_similarity(
  p_problem_id_a UUID,
  p_problem_id_b UUID
) RETURNS FLOAT AS $$
DECLARE
  v_text_a TEXT;
  v_text_b TEXT;
  v_similarity FLOAT;
BEGIN
  -- Get search content for both problems
  SELECT LOWER(search_content) INTO v_text_a
  FROM problem_bank WHERE id = p_problem_id_a;

  SELECT LOWER(search_content) INTO v_text_b
  FROM problem_bank WHERE id = p_problem_id_b;

  IF v_text_a IS NULL OR v_text_b IS NULL THEN
    RETURN 0;
  END IF;

  -- Use PostgreSQL's built-in word similarity
  v_similarity := word_similarity(v_text_a, v_text_b);

  RETURN v_similarity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to find similar problems for a given problem
CREATE OR REPLACE FUNCTION find_similar_problems(
  p_problem_id UUID,
  p_limit INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  -- First check pre-computed similarities
  SELECT
    pb.id,
    pb.title,
    pb.problem_statement,
    pb.theme,
    ps.similarity_score
  FROM problem_similarities ps
  JOIN problem_bank pb ON (
    CASE
      WHEN ps.problem_id_a = p_problem_id THEN ps.problem_id_b
      ELSE ps.problem_id_a
    END = pb.id
  )
  WHERE (ps.problem_id_a = p_problem_id OR ps.problem_id_b = p_problem_id)
    AND pb.status IN ('open', 'claimed', 'in_progress')
  ORDER BY ps.similarity_score DESC
  LIMIT p_limit;

  -- If no pre-computed results, fall back to theme matching
  IF NOT FOUND THEN
    RETURN QUERY
    WITH source AS (
      SELECT theme, search_content FROM problem_bank WHERE id = p_problem_id
    )
    SELECT
      pb.id,
      pb.title,
      pb.problem_statement,
      pb.theme,
      CASE
        WHEN pb.theme = (SELECT theme FROM source) THEN 0.8
        ELSE 0.3
      END::FLOAT as similarity_score
    FROM problem_bank pb
    CROSS JOIN source s
    WHERE pb.id != p_problem_id
      AND pb.status IN ('open', 'claimed', 'in_progress')
      AND (
        pb.theme = (SELECT theme FROM source)
        OR pb.search_content ILIKE '%' || split_part(s.search_content, ' ', 1) || '%'
      )
    ORDER BY similarity_score DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to compute and store similarities for a problem
CREATE OR REPLACE FUNCTION compute_problem_similarities(
  p_problem_id UUID,
  p_threshold FLOAT DEFAULT 0.3
) RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_source RECORD;
  v_target RECORD;
  v_similarity FLOAT;
  v_id_a UUID;
  v_id_b UUID;
BEGIN
  -- Get source problem
  SELECT id, theme, search_content INTO v_source
  FROM problem_bank WHERE id = p_problem_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Compare with all other problems
  FOR v_target IN
    SELECT id, theme, search_content
    FROM problem_bank
    WHERE id != p_problem_id AND status = 'open'
  LOOP
    -- Compute similarity
    IF v_source.theme = v_target.theme THEN
      v_similarity := 0.8; -- Same theme = high similarity
    ELSE
      -- Use text similarity for different themes
      v_similarity := word_similarity(
        LOWER(v_source.search_content),
        LOWER(v_target.search_content)
      );
    END IF;

    -- Only store if above threshold
    IF v_similarity >= p_threshold THEN
      -- Ensure canonical ordering (smaller UUID first)
      IF p_problem_id < v_target.id THEN
        v_id_a := p_problem_id;
        v_id_b := v_target.id;
      ELSE
        v_id_a := v_target.id;
        v_id_b := p_problem_id;
      END IF;

      -- Upsert similarity
      INSERT INTO problem_similarities (problem_id_a, problem_id_b, similarity_score, similarity_type)
      VALUES (v_id_a, v_id_b, v_similarity, 'keyword')
      ON CONFLICT (problem_id_a, problem_id_b)
      DO UPDATE SET
        similarity_score = EXCLUDED.similarity_score,
        computed_at = NOW();

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update cluster statistics
CREATE OR REPLACE FUNCTION update_cluster_stats(p_cluster_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT
    COUNT(DISTINCT pcm.problem_id) as problem_count,
    AVG(pb.severity_rating) as avg_severity,
    COUNT(DISTINCT pb.institution_id) as institutions_count,
    COUNT(DISTINCT pb.institution_id) > 1 as cross_institutional
  INTO v_stats
  FROM problem_cluster_members pcm
  JOIN problem_bank pb ON pcm.problem_id = pb.id
  WHERE pcm.cluster_id = p_cluster_id;

  UPDATE problem_clusters
  SET
    problem_count = v_stats.problem_count,
    avg_severity = v_stats.avg_severity,
    institutions_count = v_stats.institutions_count,
    cross_institutional = v_stats.cross_institutional,
    updated_at = NOW()
  WHERE id = p_cluster_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cluster stats when members change
CREATE OR REPLACE FUNCTION trigger_update_cluster_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_cluster_stats(OLD.cluster_id);
    RETURN OLD;
  ELSE
    PERFORM update_cluster_stats(NEW.cluster_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cluster_stats_trigger ON problem_cluster_members;
CREATE TRIGGER update_cluster_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON problem_cluster_members
  FOR EACH ROW EXECUTE FUNCTION trigger_update_cluster_stats();

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Problem similarity network view
CREATE OR REPLACE VIEW problem_similarity_network AS
SELECT
  ps.problem_id_a,
  pb_a.title as title_a,
  pb_a.theme as theme_a,
  ps.problem_id_b,
  pb_b.title as title_b,
  pb_b.theme as theme_b,
  ps.similarity_score,
  ps.similarity_type,
  pb_a.institution_id = pb_b.institution_id as same_institution
FROM problem_similarities ps
JOIN problem_bank pb_a ON ps.problem_id_a = pb_a.id
JOIN problem_bank pb_b ON ps.problem_id_b = pb_b.id
WHERE pb_a.status = 'open' AND pb_b.status = 'open'
ORDER BY ps.similarity_score DESC;

GRANT SELECT ON problem_similarity_network TO authenticated;

-- Cluster overview
CREATE OR REPLACE VIEW cluster_overview AS
SELECT
  pc.id,
  pc.name,
  pc.description,
  pc.primary_theme,
  pc.problem_count,
  pc.avg_severity,
  pc.cross_institutional,
  pc.institutions_count,
  pc.ai_summary,
  pc.key_patterns,
  ARRAY_AGG(DISTINCT i.short_name) FILTER (WHERE i.short_name IS NOT NULL) as institutions,
  ARRAY_AGG(pb.title ORDER BY pb.severity_rating DESC NULLS LAST) FILTER (WHERE pb.title IS NOT NULL) as problem_titles
FROM problem_clusters pc
LEFT JOIN problem_cluster_members pcm ON pc.id = pcm.cluster_id
LEFT JOIN problem_bank pb ON pcm.problem_id = pb.id
LEFT JOIN institutions i ON pb.institution_id = i.id
WHERE pc.status = 'active'
GROUP BY pc.id
ORDER BY pc.problem_count DESC, pc.avg_severity DESC NULLS LAST;

GRANT SELECT ON cluster_overview TO authenticated;

-- Hot spots (problems identified across multiple institutions)
CREATE OR REPLACE VIEW cross_institutional_patterns AS
SELECT
  pb.theme,
  COUNT(*) as problem_count,
  COUNT(DISTINCT pb.institution_id) as institutions_count,
  AVG(pb.severity_rating) as avg_severity,
  ARRAY_AGG(DISTINCT i.short_name) as institutions,
  ARRAY_AGG(pb.title ORDER BY pb.created_at DESC) as recent_problems
FROM problem_bank pb
JOIN institutions i ON pb.institution_id = i.id
WHERE pb.status = 'open'
  AND pb.created_at > NOW() - INTERVAL '90 days'
GROUP BY pb.theme
HAVING COUNT(DISTINCT pb.institution_id) >= 2
ORDER BY institutions_count DESC, problem_count DESC;

GRANT SELECT ON cross_institutional_patterns TO authenticated;

-- Problem evolution timeline
CREATE OR REPLACE VIEW problem_evolution_timeline AS
SELECT
  pe.problem_id,
  pb.title as current_title,
  pe.version,
  pe.change_type,
  pe.change_reason,
  pe.previous_title,
  pe.new_title,
  LEFT(pe.previous_statement, 100) as previous_statement_preview,
  LEFT(pe.new_statement, 100) as new_statement_preview,
  pe.improvement_score,
  u.email as changed_by_email,
  pe.changed_at
FROM problem_evolution pe
JOIN problem_bank pb ON pe.problem_id = pb.id
LEFT JOIN users u ON pe.changed_by = u.id
ORDER BY pe.problem_id, pe.version;

GRANT SELECT ON problem_evolution_timeline TO authenticated;
