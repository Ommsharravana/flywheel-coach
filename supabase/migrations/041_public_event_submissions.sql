-- Public Event Submissions RPC
-- Returns submitted entries for public display (status = 'submitted' or higher)

CREATE OR REPLACE FUNCTION get_event_submissions_public(
  target_event_slug TEXT
)
RETURNS TABLE (
  id UUID,
  app_name TEXT,
  problem_statement TEXT,
  solution_summary TEXT,
  live_url TEXT,
  category TEXT,
  participation_type TEXT,
  team_name TEXT,
  applicant_name TEXT,
  institution_name TEXT,
  institution_short TEXT,
  submission_number TEXT,
  status TEXT,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.app_name,
    s.problem_statement,
    s.solution_summary,
    s.live_url,
    s.category,
    s.participation_type,
    s.team_name,
    s.applicant_name,
    i.name as institution_name,
    i.short_name as institution_short,
    s.submission_number,
    s.status,
    s.submitted_at
  FROM appathon_submissions s
  JOIN events e ON s.event_id = e.id
  LEFT JOIN institutions i ON s.institution_id = i.id
  WHERE e.slug = target_event_slug
    AND s.status IN ('submitted', 'under_review', 'shortlisted', 'winner')
  ORDER BY
    CASE s.status
      WHEN 'winner' THEN 1
      WHEN 'shortlisted' THEN 2
      ELSE 3
    END,
    s.submitted_at DESC;
END;
$$;

-- Grant execute to authenticated and anon (public page)
GRANT EXECUTE ON FUNCTION get_event_submissions_public(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_submissions_public(TEXT) TO anon;
