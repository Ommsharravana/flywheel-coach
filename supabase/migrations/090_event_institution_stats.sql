-- Migration: Add get_event_institution_stats function
-- Returns institution breakdown for an event showing builder and cycle counts

CREATE OR REPLACE FUNCTION get_event_institution_stats(target_event_id UUID)
RETURNS TABLE(
  institution_id UUID,
  institution_name TEXT,
  builder_count BIGINT,
  cycle_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id as institution_id,
    i.name as institution_name,
    COUNT(DISTINCT u.id)::BIGINT as builder_count,
    COUNT(DISTINCT c.id)::BIGINT as cycle_count
  FROM institutions i
  LEFT JOIN users u ON u.institution_id = i.id
  LEFT JOIN cycles c ON c.user_id = u.id AND c.event_id = target_event_id
  WHERE EXISTS (
    SELECT 1 FROM cycles c2
    WHERE c2.event_id = target_event_id
    AND c2.user_id IN (SELECT id FROM users WHERE institution_id = i.id)
  )
  GROUP BY i.id, i.name
  ORDER BY COUNT(DISTINCT c.id) DESC, COUNT(DISTINCT u.id) DESC;
END;
$$;
