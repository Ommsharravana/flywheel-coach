-- P07: Multi-Source Problem Bank
-- Allows problems from: learners (direct), departments (admin submit), industry (partner submit with approval)

-- ============================================
-- SCHEMA CHANGES
-- ============================================

-- 1. Expand source_type to include department and industry
ALTER TABLE problem_bank
DROP CONSTRAINT IF EXISTS problem_bank_source_type_check;

ALTER TABLE problem_bank
ADD CONSTRAINT problem_bank_source_type_check
CHECK (source_type IN ('cycle', 'manual', 'import', 'appathon', 'department', 'industry'));

-- 2. Add approval status for industry submissions
ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 3. Add industry partner contact info
ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS industry_partner_name TEXT;

ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS industry_partner_email TEXT;

ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS industry_partner_company TEXT;

ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS industry_partner_phone TEXT;

-- 4. Add team claim tracking
ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS claimed_by_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- 5. Add budget for industry problems (for P08: Industry Projects & Revenue)
ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(12, 2);

ALTER TABLE problem_bank
ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'INR';

-- Create index for claimed problems
CREATE INDEX IF NOT EXISTS idx_problem_bank_claimed_by_team ON problem_bank(claimed_by_team_id);
CREATE INDEX IF NOT EXISTS idx_problem_bank_approval_status ON problem_bank(approval_status);

-- ============================================
-- RLS POLICIES UPDATE
-- ============================================

-- Industry submissions require approval - only show approved or own submissions
DROP POLICY IF EXISTS "Anyone can view open problems" ON problem_bank;
CREATE POLICY "Anyone can view open problems"
  ON problem_bank FOR SELECT
  USING (
    (approval_status = 'approved' AND status IN ('open', 'claimed', 'in_progress', 'solved'))
    OR submitted_by = auth.uid()
    OR is_superadmin()
    OR is_event_admin_for_any_event()
  );

-- Allow industry partners (unauthenticated or authenticated) to submit problems
-- These go to pending approval
DROP POLICY IF EXISTS "Users can insert own problems" ON problem_bank;
CREATE POLICY "Users can insert own problems"
  ON problem_bank FOR INSERT
  WITH CHECK (
    -- Authenticated users can submit
    auth.uid() = submitted_by
    -- Or it's an industry submission (submitted_by can be null)
    OR (source_type = 'industry' AND submitted_by IS NULL)
  );

-- ============================================
-- RPC: Get Pending Industry Submissions for Admin Review
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_industry_submissions()
RETURNS TABLE (
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  severity_rating INT,
  industry_partner_name TEXT,
  industry_partner_email TEXT,
  industry_partner_company TEXT,
  budget_amount DECIMAL,
  budget_currency TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only superadmins and event admins can see pending submissions
  IF NOT (is_superadmin() OR is_event_admin_for_any_event()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    pb.id,
    pb.title,
    pb.problem_statement,
    pb.theme,
    pb.severity_rating,
    pb.industry_partner_name,
    pb.industry_partner_email,
    pb.industry_partner_company,
    pb.budget_amount,
    pb.budget_currency,
    pb.created_at
  FROM problem_bank pb
  WHERE pb.source_type = 'industry'
    AND pb.approval_status = 'pending'
  ORDER BY pb.created_at DESC;
END;
$$;

-- ============================================
-- RPC: Approve/Reject Industry Submission
-- ============================================

CREATE OR REPLACE FUNCTION review_industry_submission(
  p_problem_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only superadmins and event admins can review
  IF NOT (is_superadmin() OR is_event_admin_for_any_event()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action. Use approve or reject';
  END IF;

  UPDATE problem_bank
  SET
    approval_status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'reviewed_by', auth.uid(),
      'reviewed_at', NOW(),
      'review_notes', p_notes
    ),
    updated_at = NOW()
  WHERE id = p_problem_id
    AND source_type = 'industry'
    AND approval_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Problem not found or not a pending industry submission';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'problem_id', p_problem_id
  );
END;
$$;

-- ============================================
-- RPC: Claim Problem for Team
-- ============================================

CREATE OR REPLACE FUNCTION claim_problem_for_team(
  p_problem_id UUID,
  p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_problem RECORD;
  v_team RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get problem
  SELECT * INTO v_problem FROM problem_bank WHERE id = p_problem_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Problem not found';
  END IF;

  -- Check problem is open and approved
  IF v_problem.status NOT IN ('open') THEN
    RAISE EXCEPTION 'Problem is not open for claims';
  END IF;

  IF v_problem.approval_status != 'approved' THEN
    RAISE EXCEPTION 'Problem is not approved';
  END IF;

  IF v_problem.claimed_by_team_id IS NOT NULL THEN
    RAISE EXCEPTION 'Problem is already claimed by another team';
  END IF;

  -- Get team and verify user is a member
  SELECT * INTO v_team FROM teams WHERE id = p_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Check user is team lead or member
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this team';
  END IF;

  -- Claim the problem
  UPDATE problem_bank
  SET
    claimed_by_team_id = p_team_id,
    claimed_at = NOW(),
    status = 'claimed',
    updated_at = NOW()
  WHERE id = p_problem_id;

  -- Create a problem attempt record
  INSERT INTO problem_attempts (
    problem_id,
    user_id,
    team_name,
    outcome,
    started_at
  ) VALUES (
    p_problem_id,
    v_user_id,
    v_team.name,
    'building',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'problem_id', p_problem_id,
    'team_id', p_team_id,
    'claimed_at', NOW()
  );
END;
$$;

-- ============================================
-- RPC: Release Problem Claim
-- ============================================

CREATE OR REPLACE FUNCTION release_problem_claim(
  p_problem_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_problem RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get problem
  SELECT * INTO v_problem FROM problem_bank WHERE id = p_problem_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Problem not found';
  END IF;

  -- Check if claimed
  IF v_problem.claimed_by_team_id IS NULL THEN
    RAISE EXCEPTION 'Problem is not claimed';
  END IF;

  -- Check user is team member or admin
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_problem.claimed_by_team_id
      AND user_id = v_user_id
  ) AND NOT is_superadmin() THEN
    RAISE EXCEPTION 'You cannot release this claim';
  END IF;

  -- Release the claim
  UPDATE problem_bank
  SET
    claimed_by_team_id = NULL,
    claimed_at = NULL,
    status = 'open',
    updated_at = NOW()
  WHERE id = p_problem_id;

  -- Update attempt to abandoned
  UPDATE problem_attempts
  SET
    outcome = 'abandoned',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE problem_id = p_problem_id
    AND outcome = 'building';

  RETURN jsonb_build_object(
    'success', true,
    'problem_id', p_problem_id
  );
END;
$$;

-- ============================================
-- RPC: Get Problem Bank with Sources
-- ============================================

CREATE OR REPLACE FUNCTION get_problem_bank_with_sources(
  p_source_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_theme_filter TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  status TEXT,
  source_type TEXT,
  approval_status TEXT,
  severity_rating INT,
  validation_status TEXT,
  desperate_user_score INT,
  institution_name TEXT,
  submitter_name TEXT,
  industry_partner_name TEXT,
  industry_partner_company TEXT,
  budget_amount DECIMAL,
  claimed_by_team_name TEXT,
  claimed_at TIMESTAMPTZ,
  attempt_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pb.id,
    pb.title,
    pb.problem_statement,
    pb.theme,
    pb.status,
    pb.source_type,
    pb.approval_status,
    pb.severity_rating,
    pb.validation_status,
    pb.desperate_user_score,
    i.name AS institution_name,
    u.name AS submitter_name,
    pb.industry_partner_name,
    pb.industry_partner_company,
    pb.budget_amount,
    t.name AS claimed_by_team_name,
    pb.claimed_at,
    (SELECT COUNT(*) FROM problem_attempts pa WHERE pa.problem_id = pb.id) AS attempt_count,
    pb.created_at
  FROM problem_bank pb
  LEFT JOIN institutions i ON pb.institution_id = i.id
  LEFT JOIN users u ON pb.submitted_by = u.id
  LEFT JOIN teams t ON pb.claimed_by_team_id = t.id
  WHERE
    -- Only show approved problems or own submissions
    (pb.approval_status = 'approved' OR pb.submitted_by = auth.uid() OR is_superadmin())
    -- Source filter
    AND (p_source_filter IS NULL OR pb.source_type = p_source_filter)
    -- Status filter
    AND (p_status_filter IS NULL OR pb.status = p_status_filter)
    -- Theme filter
    AND (p_theme_filter IS NULL OR pb.theme = p_theme_filter)
    -- Search
    AND (p_search IS NULL OR pb.search_content ILIKE '%' || p_search || '%')
  ORDER BY pb.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_industry_submissions() TO authenticated;
GRANT EXECUTE ON FUNCTION review_industry_submission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_problem_for_team(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_problem_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_problem_bank_with_sources(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
