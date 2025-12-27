-- Fix remaining admin RPC functions for Activity Log and NIF Pipeline
-- This fixes issues with Next.js server components where auth.uid() may not work reliably

-- =============================================================================
-- NEW: get_admin_activity_logs - fetches activity logs with admin permissions
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_activity_logs(
  caller_user_id UUID DEFAULT NULL,
  limit_count INT DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  admin_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ,
  admin_name TEXT,
  admin_email TEXT
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

  -- Superadmin sees all activity logs
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      l.id,
      l.admin_id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.details,
      l.ip_address,
      l.created_at,
      u.name as admin_name,
      u.email as admin_email
    FROM public.admin_activity_logs l
    LEFT JOIN public.users u ON u.id = l.admin_id
    ORDER BY l.created_at DESC
    LIMIT limit_count;

  -- Institution admin sees only their institution's activity
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      l.id,
      l.admin_id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.details,
      l.ip_address,
      l.created_at,
      u.name as admin_name,
      u.email as admin_email
    FROM public.admin_activity_logs l
    LEFT JOIN public.users u ON u.id = l.admin_id
    WHERE u.institution_id = calling_user_institution
    ORDER BY l.created_at DESC
    LIMIT limit_count;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_activity_logs(UUID, INT) TO authenticated;


-- =============================================================================
-- NEW: get_nif_pipeline_admin - fetches NIF pipeline candidates with admin permissions
-- =============================================================================

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
  composite_score NUMERIC
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


-- =============================================================================
-- NEW: get_nif_pipeline_stats_admin - fetches NIF pipeline stats for dashboard
-- =============================================================================

CREATE OR REPLACE FUNCTION get_nif_pipeline_stats_admin(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_candidates BIGINT,
  by_stage JSONB,
  total_startups BIGINT,
  total_jobs_created BIGINT,
  total_revenue NUMERIC,
  avg_time_to_graduation_days INT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
  stage_counts JSONB;
  incubating_count BIGINT;
  graduated_count BIGINT;
  jobs_sum BIGINT;
  revenue_sum NUMERIC;
  graduation_days_avg INT;
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

  -- Superadmin sees all stats
  IF calling_user_role = 'superadmin' THEN
    -- Get stage counts as JSON
    SELECT jsonb_object_agg(stage, cnt) INTO stage_counts
    FROM (
      SELECT stage, COUNT(*) as cnt
      FROM public.nif_candidates
      GROUP BY stage
    ) sub;

    -- Get other stats
    SELECT
      COALESCE(SUM(CASE WHEN stage = 'incubating' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN stage = 'graduated' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(jobs_created), 0),
      COALESCE(SUM(revenue_generated), 0)
    INTO incubating_count, graduated_count, jobs_sum, revenue_sum
    FROM public.nif_candidates;

    -- Calculate avg graduation time
    SELECT
      CASE
        WHEN COUNT(*) > 0 THEN
          AVG(EXTRACT(DAY FROM (graduated_at - identified_at)))::INT
        ELSE NULL
      END
    INTO graduation_days_avg
    FROM public.nif_candidates
    WHERE stage = 'graduated' AND graduated_at IS NOT NULL AND identified_at IS NOT NULL;

    RETURN QUERY
    SELECT
      (SELECT COUNT(*) FROM public.nif_candidates)::BIGINT,
      COALESCE(stage_counts, '{}'::JSONB),
      (incubating_count + graduated_count)::BIGINT,
      jobs_sum,
      revenue_sum,
      graduation_days_avg;

  -- Institution admin sees only their institution's stats
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    -- Get stage counts as JSON for institution
    SELECT jsonb_object_agg(stage, cnt) INTO stage_counts
    FROM (
      SELECT c.stage, COUNT(*) as cnt
      FROM public.nif_candidates c
      JOIN public.problem_bank p ON p.id = c.problem_id
      WHERE p.institution_id = calling_user_institution
      GROUP BY c.stage
    ) sub;

    -- Get other stats for institution
    SELECT
      COALESCE(SUM(CASE WHEN c.stage = 'incubating' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN c.stage = 'graduated' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(c.jobs_created), 0),
      COALESCE(SUM(c.revenue_generated), 0)
    INTO incubating_count, graduated_count, jobs_sum, revenue_sum
    FROM public.nif_candidates c
    JOIN public.problem_bank p ON p.id = c.problem_id
    WHERE p.institution_id = calling_user_institution;

    -- Calculate avg graduation time for institution
    SELECT
      CASE
        WHEN COUNT(*) > 0 THEN
          AVG(EXTRACT(DAY FROM (c.graduated_at - c.identified_at)))::INT
        ELSE NULL
      END
    INTO graduation_days_avg
    FROM public.nif_candidates c
    JOIN public.problem_bank p ON p.id = c.problem_id
    WHERE p.institution_id = calling_user_institution
      AND c.stage = 'graduated'
      AND c.graduated_at IS NOT NULL
      AND c.identified_at IS NOT NULL;

    RETURN QUERY
    SELECT
      (SELECT COUNT(*) FROM public.nif_candidates c2
       JOIN public.problem_bank p2 ON p2.id = c2.problem_id
       WHERE p2.institution_id = calling_user_institution)::BIGINT,
      COALESCE(stage_counts, '{}'::JSONB),
      (incubating_count + graduated_count)::BIGINT,
      jobs_sum,
      revenue_sum,
      graduation_days_avg;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_nif_pipeline_stats_admin(UUID) TO authenticated;
