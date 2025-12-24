-- Problem Bank Fixes
-- Adds 'myjkkn' theme and improves analytics

-- ============================================
-- FIX THEME CONSTRAINT (add 'myjkkn')
-- ============================================

-- Drop and recreate the theme constraint to include 'myjkkn'
ALTER TABLE problem_bank DROP CONSTRAINT IF EXISTS problem_bank_theme_check;
ALTER TABLE problem_bank ADD CONSTRAINT problem_bank_theme_check
  CHECK (theme IN ('healthcare', 'education', 'agriculture', 'environment', 'community', 'myjkkn', 'operations', 'productivity', 'other'));

-- ============================================
-- ADD BEST SOLUTION FIELDS
-- ============================================

-- Add columns for tracking the best solution if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problem_bank' AND column_name = 'best_solution_url') THEN
    ALTER TABLE problem_bank ADD COLUMN best_solution_url TEXT;
  END IF;
END $$;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Drop and recreate institution leaderboard view
DROP VIEW IF EXISTS institution_problem_leaderboard;
CREATE VIEW institution_problem_leaderboard AS
WITH cycle_counts AS (
  -- Count problems from cycles (even unsaved ones)
  SELECT
    u.institution_id,
    COUNT(DISTINCT c.id) as cycle_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.current_step >= 7) as completed_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.refined_statement IS NOT NULL OR p.selected_question IS NOT NULL) as problem_count
  FROM cycles c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN problems p ON p.cycle_id = c.id
  WHERE u.institution_id IS NOT NULL
  GROUP BY u.institution_id
),
saved_counts AS (
  -- Count saved problems in problem_bank
  SELECT
    institution_id,
    COUNT(*) as saved_count,
    COUNT(*) FILTER (WHERE status = 'solved') as solved_count,
    COUNT(*) FILTER (WHERE validation_status = 'desperate_user_confirmed') as validated_count
  FROM problem_bank
  WHERE institution_id IS NOT NULL
  GROUP BY institution_id
)
SELECT
  i.id as institution_id,
  i.name as institution_name,
  i.short_name,
  COALESCE(cc.cycle_count, 0) as total_cycles,
  COALESCE(cc.completed_count, 0) as completed_cycles,
  COALESCE(cc.problem_count, 0) as problems_identified,
  COALESCE(sc.saved_count, 0) as problems_saved,
  COALESCE(sc.solved_count, 0) as problems_solved,
  COALESCE(sc.validated_count, 0) as problems_validated
FROM institutions i
LEFT JOIN cycle_counts cc ON cc.institution_id = i.id
LEFT JOIN saved_counts sc ON sc.institution_id = i.id
ORDER BY
  COALESCE(cc.problem_count, 0) DESC,
  COALESCE(cc.completed_count, 0) DESC;

GRANT SELECT ON institution_problem_leaderboard TO authenticated;

-- Theme breakdown across all cycles (not just saved)
DROP VIEW IF EXISTS theme_breakdown_all_cycles;
CREATE VIEW theme_breakdown_all_cycles AS
WITH problem_themes AS (
  SELECT
    c.id as cycle_id,
    c.user_id,
    u.institution_id,
    COALESCE(
      -- Auto-detect theme from problem text
      CASE
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'health|patient|hospital|clinic|medical|doctor|nurse|pharma|drug|medicine|dental|tooth|prescription|opd|ward|diagnosis|treatment|therapy' THEN 'healthcare'
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'education|student|learner|teacher|school|college|course|exam|study|class|syllabus|grade|marks|attendance|learning|curriculum' THEN 'education'
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'farm|crop|agriculture|soil|harvest|irrigation|farmer|plant|seed|pesticide|livestock|cattle|poultry|fishery' THEN 'agriculture'
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'environment|waste|pollution|water|air|climate|sustainability|recycle|plastic|green|carbon|ecology|conservation' THEN 'environment'
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'community|social|village|society|public|welfare|volunteer|ngo|help|civic|neighborhood|local' THEN 'community'
        WHEN LOWER(COALESCE(p.refined_statement, '') || ' ' || COALESCE(p.selected_question, '')) ~ 'myjkkn|jkkn|institution|campus|college management|admin|erp|portal' THEN 'myjkkn'
        ELSE 'other'
      END
    , 'other') as detected_theme
  FROM cycles c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN problems p ON p.cycle_id = c.id
  WHERE p.refined_statement IS NOT NULL OR p.selected_question IS NOT NULL
    OR p.q_takes_too_long IS NOT NULL OR p.q_repetitive IS NOT NULL
)
SELECT
  detected_theme as theme,
  COUNT(*) as problem_count,
  COUNT(DISTINCT institution_id) as institutions
FROM problem_themes
GROUP BY detected_theme
ORDER BY problem_count DESC;

GRANT SELECT ON theme_breakdown_all_cycles TO authenticated;

-- ============================================
-- FUNCTION: Get similar problems by keyword
-- ============================================

CREATE OR REPLACE FUNCTION find_similar_problems(p_problem_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  similarity_score FLOAT
) AS $$
DECLARE
  v_search_text TEXT;
BEGIN
  -- Get the problem's search content
  SELECT search_content INTO v_search_text
  FROM problem_bank
  WHERE problem_bank.id = p_problem_id;

  IF v_search_text IS NULL THEN
    RETURN;
  END IF;

  -- Find similar problems using full-text search
  RETURN QUERY
  SELECT
    pb.id,
    pb.title,
    pb.problem_statement,
    pb.theme,
    ts_rank(to_tsvector('english', pb.search_content), plainto_tsquery('english', v_search_text))::FLOAT as similarity_score
  FROM problem_bank pb
  WHERE pb.id != p_problem_id
    AND to_tsvector('english', pb.search_content) @@ plainto_tsquery('english', v_search_text)
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE TRIGGER FOR PROBLEM STATUS
-- ============================================

-- When an attempt succeeds, update problem status
CREATE OR REPLACE FUNCTION update_problem_on_attempt_success()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outcome = 'success' AND (OLD.outcome IS NULL OR OLD.outcome != 'success') THEN
    UPDATE problem_bank
    SET
      status = 'solved',
      best_solution_cycle_id = NEW.cycle_id,
      best_solution_url = NEW.app_url,
      updated_at = NOW()
    WHERE id = NEW.problem_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_problem_on_success ON problem_attempts;
CREATE TRIGGER trigger_update_problem_on_success
  AFTER UPDATE ON problem_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_on_attempt_success();
