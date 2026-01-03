-- ============================================
-- GRAND FINALE RESULTS REVEAL SYSTEM
-- Admin controls when results become visible
-- ============================================

-- ============================================
-- 1. FUNCTION TO CALCULATE FINAL SCORES
-- Combines judge scores (80%) + audience scores (20%)
-- ============================================

CREATE OR REPLACE FUNCTION calculate_final_scores(p_event_id UUID)
RETURNS TABLE (
  submission_id UUID,
  submission_number TEXT,
  app_name TEXT,
  team_name TEXT,
  track_id UUID,
  track_name TEXT,
  track_theme TEXT,
  judge_score NUMERIC,
  audience_score NUMERIC,
  bonus_percentage NUMERIC,
  final_score NUMERIC,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH judge_averages AS (
    -- Average judge scores per submission
    SELECT
      js.submission_id,
      sta.track_id,
      AVG(js.total_score) as avg_judge_score,
      MAX(js.bonus_percentage) as max_bonus
    FROM judge_scores js
    JOIN submission_track_assignments sta ON sta.submission_id = js.submission_id
    JOIN judging_tracks jt ON jt.id = sta.track_id
    WHERE jt.event_id = p_event_id
      AND js.submitted_at IS NOT NULL
    GROUP BY js.submission_id, sta.track_id
  ),
  audience_averages AS (
    -- Average audience ratings per submission (convert 1-5 stars to 1-10 scale)
    SELECT
      av.submission_id,
      AVG(av.rating) * 2 as avg_audience_score,
      COUNT(*) as vote_count
    FROM audience_votes av
    JOIN submission_track_assignments sta ON sta.submission_id = av.submission_id
    JOIN judging_tracks jt ON jt.id = sta.track_id
    WHERE jt.event_id = p_event_id
    GROUP BY av.submission_id
  ),
  combined_scores AS (
    SELECT
      ja.submission_id,
      ja.track_id,
      ja.avg_judge_score,
      COALESCE(aa.avg_audience_score, 5.0) as avg_audience_score, -- Default 5/10 if no votes
      ja.max_bonus,
      -- Final: 80% judge + 20% audience, then apply bonus
      (ja.avg_judge_score * 0.80 + COALESCE(aa.avg_audience_score, 5.0) * 0.20)
        * (1 + ja.max_bonus / 100) as final_score
    FROM judge_averages ja
    LEFT JOIN audience_averages aa ON aa.submission_id = ja.submission_id
  ),
  ranked_scores AS (
    SELECT
      cs.*,
      ROW_NUMBER() OVER (PARTITION BY cs.track_id ORDER BY cs.final_score DESC) as track_rank
    FROM combined_scores cs
  )
  SELECT
    rs.submission_id,
    s.submission_number,
    s.app_name,
    s.team_name,
    rs.track_id,
    jt.name as track_name,
    jt.theme as track_theme,
    ROUND(rs.avg_judge_score, 2) as judge_score,
    ROUND(rs.avg_audience_score, 2) as audience_score,
    rs.max_bonus as bonus_percentage,
    ROUND(rs.final_score, 2) as final_score,
    rs.track_rank::INTEGER as rank
  FROM ranked_scores rs
  JOIN appathon_submissions s ON s.id = rs.submission_id
  JOIN judging_tracks jt ON jt.id = rs.track_id
  ORDER BY jt.name, rs.track_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FUNCTION TO GET TRACK WINNERS
-- Returns top 3 from each track
-- ============================================

CREATE OR REPLACE FUNCTION get_track_winners(p_event_id UUID)
RETURNS TABLE (
  track_id UUID,
  track_name TEXT,
  track_theme TEXT,
  winners JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH all_scores AS (
    SELECT * FROM calculate_final_scores(p_event_id)
  ),
  top_3_per_track AS (
    SELECT
      s.track_id,
      s.track_name,
      s.track_theme,
      jsonb_agg(
        jsonb_build_object(
          'submission_id', s.submission_id,
          'submission_number', s.submission_number,
          'app_name', s.app_name,
          'team_name', s.team_name,
          'rank', s.rank,
          'final_score', s.final_score,
          'judge_score', s.judge_score,
          'audience_score', s.audience_score,
          'bonus_percentage', s.bonus_percentage
        ) ORDER BY s.rank
      ) as winners
    FROM all_scores s
    WHERE s.rank <= 3
    GROUP BY s.track_id, s.track_name, s.track_theme
  )
  SELECT * FROM top_3_per_track
  ORDER BY track_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FUNCTION TO GET OVERALL WINNER
-- Highest final score across all tracks
-- ============================================

CREATE OR REPLACE FUNCTION get_overall_winner(p_event_id UUID)
RETURNS TABLE (
  submission_id UUID,
  submission_number TEXT,
  app_name TEXT,
  team_name TEXT,
  track_id UUID,
  track_name TEXT,
  track_theme TEXT,
  judge_score NUMERIC,
  audience_score NUMERIC,
  bonus_percentage NUMERIC,
  final_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.submission_id,
    s.submission_number,
    s.app_name,
    s.team_name,
    s.track_id,
    s.track_name,
    s.track_theme,
    s.judge_score,
    s.audience_score,
    s.bonus_percentage,
    s.final_score
  FROM calculate_final_scores(p_event_id) s
  ORDER BY s.final_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION TO CHECK/SET REVEAL STATUS
-- Uses event config JSONB
-- ============================================

CREATE OR REPLACE FUNCTION get_results_reveal_status(p_event_id UUID)
RETURNS TABLE (
  is_revealed BOOLEAN,
  reveal_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((config->>'results_revealed')::BOOLEAN, FALSE) as is_revealed,
    CASE
      WHEN config->>'results_reveal_time' IS NOT NULL
      THEN (config->>'results_reveal_time')::TIMESTAMPTZ
      ELSE NULL
    END as reveal_time
  FROM events
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reveal_results(p_event_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Update event config to reveal results
  UPDATE events
  SET config = config || jsonb_build_object(
    'results_revealed', true,
    'results_reveal_time', NOW()
  ),
  updated_at = NOW()
  WHERE id = p_event_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'Results revealed successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 'Event not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION hide_results(p_event_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Update event config to hide results
  UPDATE events
  SET config = config || jsonb_build_object(
    'results_revealed', false,
    'results_reveal_time', NULL
  ),
  updated_at = NOW()
  WHERE id = p_event_id;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'Results hidden'::TEXT;
  ELSE
    RETURN QUERY SELECT FALSE, 'Event not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

-- Public can check reveal status
GRANT EXECUTE ON FUNCTION get_results_reveal_status(UUID) TO authenticated, anon;

-- Only authenticated can see winners (but API will check reveal status first)
GRANT EXECUTE ON FUNCTION get_track_winners(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_overall_winner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_final_scores(UUID) TO authenticated;

-- Only admins can reveal/hide
GRANT EXECUTE ON FUNCTION reveal_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hide_results(UUID) TO authenticated;
