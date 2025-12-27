-- Fix NIF Pipeline RPC function return type
-- The composite_score column in problem_scores is FLOAT (DOUBLE PRECISION)
-- but the RPC function declared it as NUMERIC, causing type mismatch error

-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS get_nif_pipeline_admin(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_nif_pipeline_admin(
  caller_user_id UUID DEFAULT NULL,
  stage_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  problem_id UUID,
  stage TEXT,
  identified_at TIMESTAMPTZ,
  identified_by UUID,
  screened_at TIMESTAMPTZ,
  shortlisted_at TIMESTAMPTZ,
  incubation_started_at TIMESTAMPTZ,
  graduated_at TIMESTAMPTZ,
  jobs_created INT,
  revenue_generated NUMERIC,
  decision_notes TEXT,
  problem_title TEXT,
  problem_statement TEXT,
  problem_theme TEXT,
  problem_status TEXT,
  problem_validation_status TEXT,
  problem_severity_rating INT,
  problem_institution_id UUID,
  problem_created_at TIMESTAMPTZ,
  institution_name TEXT,
  institution_short_name TEXT,
  composite_score DOUBLE PRECISION  -- Changed from NUMERIC to DOUBLE PRECISION to match FLOAT column
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all pipeline candidates
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.problem_id,
      c.stage,
      c.identified_at,
      c.identified_by,
      c.screened_at,
      c.shortlisted_at,
      c.incubation_started_at,
      c.graduated_at,
      c.jobs_created,
      c.revenue_generated,
      c.decision_notes,
      p.title as problem_title,
      p.problem_statement,
      p.theme as problem_theme,
      p.status as problem_status,
      p.validation_status as problem_validation_status,
      p.severity_rating as problem_severity_rating,
      p.institution_id as problem_institution_id,
      p.created_at as problem_created_at,
      i.name as institution_name,
      i.short_name as institution_short_name,
      ps.composite_score
    FROM public.nif_candidates c
    JOIN public.problem_bank p ON p.id = c.problem_id
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    LEFT JOIN public.problem_scores ps ON ps.problem_id = c.problem_id
    WHERE (stage_filter IS NULL OR stage_filter = 'all' OR c.stage = stage_filter)
    ORDER BY c.identified_at DESC;

  -- Institution admin sees only their institution's pipeline candidates
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      c.id,
      c.problem_id,
      c.stage,
      c.identified_at,
      c.identified_by,
      c.screened_at,
      c.shortlisted_at,
      c.incubation_started_at,
      c.graduated_at,
      c.jobs_created,
      c.revenue_generated,
      c.decision_notes,
      p.title as problem_title,
      p.problem_statement,
      p.theme as problem_theme,
      p.status as problem_status,
      p.validation_status as problem_validation_status,
      p.severity_rating as problem_severity_rating,
      p.institution_id as problem_institution_id,
      p.created_at as problem_created_at,
      i.name as institution_name,
      i.short_name as institution_short_name,
      ps.composite_score
    FROM public.nif_candidates c
    JOIN public.problem_bank p ON p.id = c.problem_id
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    LEFT JOIN public.problem_scores ps ON ps.problem_id = c.problem_id
    WHERE p.institution_id = calling_user_institution
      AND (stage_filter IS NULL OR stage_filter = 'all' OR c.stage = stage_filter)
    ORDER BY c.identified_at DESC;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_nif_pipeline_admin(UUID, TEXT) TO authenticated;
