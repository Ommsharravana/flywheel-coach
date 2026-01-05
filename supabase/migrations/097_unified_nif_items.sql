-- ============================================
-- UNIFIED NIF ITEMS VIEW
-- Single view combining nif_applications and nif_candidates
-- For the NIF Incubation Hub Unification feature (P04B)
-- ============================================

-- Drop existing view if exists
DROP VIEW IF EXISTS unified_nif_items;

-- ============================================
-- CREATE UNIFIED VIEW
-- ============================================
CREATE OR REPLACE VIEW unified_nif_items AS

-- Applications (from users who completed cycles)
SELECT
  'application' AS source,
  na.id,
  na.cycle_id AS source_id,
  COALESCE(na.startup_name, c.name) AS project_name,
  u.name AS applicant_name,
  u.email AS applicant_email,
  u.id AS user_id,
  i.short_name AS institution_short,

  -- Stage mapping for applications
  CASE
    WHEN na.status IN ('pending', 'under_review') THEN 'pending_review'
    WHEN na.status = 'mentor_selection' THEN 'mentor_selection'
    WHEN na.status = 'active' THEN 'active'
    WHEN na.status = 'completed' THEN 'graduated'
    WHEN na.status = 'rejected' THEN 'rejected'
    WHEN na.status = 'withdrawn' THEN 'dropped'
    ELSE na.status
  END AS stage,

  -- Original status for reference
  na.status AS original_status,

  -- Mentor info
  na.selected_mentor_id AS mentor_id,
  m.name AS mentor_name,

  -- Details
  p.refined_statement AS problem_statement,
  na.motivation,
  b.deployed_url AS project_url,

  -- Metrics
  ia.total_users,
  ia.impact_score,
  0 AS jobs_created,
  0::DECIMAL AS revenue_generated,
  NULL::FLOAT AS composite_score,

  -- Timestamps
  na.applied_at AS created_at,
  na.activated_at,
  na.completed_at AS graduated_at,
  na.updated_at

FROM nif_applications na
JOIN cycles c ON na.cycle_id = c.id
JOIN users u ON na.user_id = u.id
LEFT JOIN institutions i ON u.institution_id = i.id
LEFT JOIN problems p ON p.cycle_id = c.id
LEFT JOIN builds b ON b.cycle_id = c.id
LEFT JOIN impact_assessments ia ON ia.cycle_id = c.id
LEFT JOIN mentors m ON na.selected_mentor_id = m.id

UNION ALL

-- Problem Bank candidates (identified high-potential problems)
SELECT
  'problem_bank' AS source,
  nc.id,
  nc.problem_id AS source_id,
  COALESCE(nc.startup_name, pb.title) AS project_name,
  u.name AS applicant_name,
  u.email AS applicant_email,
  nc.identified_by AS user_id,
  i.short_name AS institution_short,

  -- Stage mapping for pipeline candidates
  CASE
    WHEN nc.stage IN ('identified', 'screened') THEN 'pending_review'
    WHEN nc.stage = 'shortlisted' THEN 'mentor_selection'
    WHEN nc.stage = 'incubating' THEN 'active'
    WHEN nc.stage = 'graduated' THEN 'graduated'
    WHEN nc.stage = 'rejected' THEN 'rejected'
    WHEN nc.stage = 'on_hold' THEN 'dropped'
    ELSE nc.stage
  END AS stage,

  -- Original stage for reference
  nc.stage AS original_status,

  -- Mentor info (pipeline candidates need mentor assignment added)
  NULL::UUID AS mentor_id,
  NULL::TEXT AS mentor_name,

  -- Details
  pb.problem_statement,
  nc.decision_notes AS motivation,
  nc.startup_website AS project_url,

  -- Metrics
  NULL::INTEGER AS total_users,
  NULL::INTEGER AS impact_score,
  nc.jobs_created,
  nc.revenue_generated,
  ps.composite_score,

  -- Timestamps
  nc.identified_at AS created_at,
  nc.incubation_started_at AS activated_at,
  nc.graduated_at,
  nc.updated_at

FROM nif_candidates nc
JOIN problem_bank pb ON nc.problem_id = pb.id
LEFT JOIN institutions i ON pb.institution_id = i.id
LEFT JOIN users u ON nc.identified_by = u.id
LEFT JOIN problem_scores ps ON pb.id = ps.problem_id;

-- ============================================
-- UNIFIED STATS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_unified_nif_stats()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'by_stage', json_build_object(
      'pending_review', COUNT(*) FILTER (WHERE stage = 'pending_review'),
      'mentor_selection', COUNT(*) FILTER (WHERE stage = 'mentor_selection'),
      'active', COUNT(*) FILTER (WHERE stage = 'active'),
      'graduated', COUNT(*) FILTER (WHERE stage = 'graduated'),
      'rejected', COUNT(*) FILTER (WHERE stage = 'rejected'),
      'dropped', COUNT(*) FILTER (WHERE stage = 'dropped')
    ),
    'by_source', json_build_object(
      'application', COUNT(*) FILTER (WHERE source = 'application'),
      'problem_bank', COUNT(*) FILTER (WHERE source = 'problem_bank')
    ),
    'startups', COUNT(*) FILTER (WHERE project_name IS NOT NULL AND project_name != ''),
    'with_mentor', COUNT(*) FILTER (WHERE mentor_id IS NOT NULL),
    'without_mentor', COUNT(*) FILTER (WHERE mentor_id IS NULL),
    'total_jobs', COALESCE(SUM(jobs_created), 0),
    'total_revenue', COALESCE(SUM(revenue_generated), 0)
  )
  INTO v_result
  FROM unified_nif_items;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE STAGE FUNCTIONS
-- ============================================

-- Update application status
CREATE OR REPLACE FUNCTION update_nif_application_stage(
  p_item_id UUID,
  p_new_stage TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_status TEXT;
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin') THEN
    RAISE EXCEPTION 'Only admins can update stages';
  END IF;

  -- Map unified stage back to application status
  v_new_status := CASE p_new_stage
    WHEN 'pending_review' THEN 'pending'
    WHEN 'mentor_selection' THEN 'mentor_selection'
    WHEN 'active' THEN 'active'
    WHEN 'graduated' THEN 'completed'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'dropped' THEN 'withdrawn'
    ELSE p_new_stage
  END;

  UPDATE nif_applications
  SET status = v_new_status
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update pipeline candidate stage
CREATE OR REPLACE FUNCTION update_nif_candidate_stage(
  p_item_id UUID,
  p_new_stage TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_status TEXT;
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin') THEN
    RAISE EXCEPTION 'Only admins can update stages';
  END IF;

  -- Map unified stage back to candidate stage
  v_new_status := CASE p_new_stage
    WHEN 'pending_review' THEN 'identified'
    WHEN 'mentor_selection' THEN 'shortlisted'
    WHEN 'active' THEN 'incubating'
    WHEN 'graduated' THEN 'graduated'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'dropped' THEN 'on_hold'
    ELSE p_new_stage
  END;

  UPDATE nif_candidates
  SET stage = v_new_status
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic update function that routes to correct table
CREATE OR REPLACE FUNCTION update_unified_nif_stage(
  p_item_id UUID,
  p_source TEXT,
  p_new_stage TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_source = 'application' THEN
    RETURN update_nif_application_stage(p_item_id, p_new_stage);
  ELSIF p_source = 'problem_bank' THEN
    RETURN update_nif_candidate_stage(p_item_id, p_new_stage);
  ELSE
    RAISE EXCEPTION 'Unknown source: %', p_source;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ASSIGN MENTOR TO UNIFIED ITEM
-- ============================================
CREATE OR REPLACE FUNCTION assign_mentor_to_unified_item(
  p_item_id UUID,
  p_source TEXT,
  p_mentor_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin') THEN
    RAISE EXCEPTION 'Only admins can assign mentors';
  END IF;

  IF p_source = 'application' THEN
    -- For applications, set selected_mentor directly and update status
    UPDATE nif_applications
    SET
      selected_mentor_id = p_mentor_id,
      status = CASE
        WHEN status IN ('pending', 'under_review', 'mentor_selection') THEN 'active'
        ELSE status
      END
    WHERE id = p_item_id;

    RETURN FOUND;
  ELSIF p_source = 'problem_bank' THEN
    -- For pipeline candidates, we need to add mentor support
    -- For now, just advance to incubating stage
    UPDATE nif_candidates
    SET stage = 'incubating'
    WHERE id = p_item_id;

    RETURN FOUND;
  ELSE
    RAISE EXCEPTION 'Unknown source: %', p_source;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SOFT DELETE UNIFIED ITEM
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_unified_item(
  p_item_id UUID,
  p_source TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin') THEN
    RAISE EXCEPTION 'Only admins can delete items';
  END IF;

  IF p_source = 'application' THEN
    UPDATE nif_applications
    SET status = 'withdrawn'
    WHERE id = p_item_id;

    RETURN FOUND;
  ELSIF p_source = 'problem_bank' THEN
    UPDATE nif_candidates
    SET stage = 'rejected'
    WHERE id = p_item_id;

    RETURN FOUND;
  ELSE
    RAISE EXCEPTION 'Unknown source: %', p_source;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON unified_nif_items TO authenticated;
