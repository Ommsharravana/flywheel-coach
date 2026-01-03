-- ============================================
-- DEMO DAY JUDGING SYSTEM
-- For Appathon 2.0 - January 7, 2026
-- ============================================

-- ============================================
-- 1. JUDGING TRACKS TABLE
-- Organizes submissions into theme-based tracks
-- ============================================

CREATE TABLE IF NOT EXISTS judging_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL, -- Maps to event config themes
  description TEXT,
  room_location TEXT,
  demo_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judging_tracks_event ON judging_tracks(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_judging_tracks_event_theme ON judging_tracks(event_id, theme);

-- ============================================
-- 2. TRACK JUDGES TABLE
-- Assigns judges to tracks
-- ============================================

CREATE TABLE IF NOT EXISTS track_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES judging_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_track_judges_track ON track_judges(track_id);
CREATE INDEX IF NOT EXISTS idx_track_judges_user ON track_judges(user_id);

-- ============================================
-- 3. SUBMISSION TRACK ASSIGNMENT
-- Links submissions to judging tracks
-- ============================================

CREATE TABLE IF NOT EXISTS submission_track_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES appathon_submissions(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES judging_tracks(id) ON DELETE CASCADE,
  demo_slot INTEGER, -- Order within the track
  demo_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'presenting', 'completed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_sta_submission ON submission_track_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_sta_track ON submission_track_assignments(track_id);

-- ============================================
-- 4. JUDGE SCORES TABLE
-- Individual criterion scores from judges
-- ============================================

CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES appathon_submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES judging_tracks(id) ON DELETE SET NULL,

  -- Individual criterion scores (1-10 scale)
  problem_impact INTEGER CHECK (problem_impact >= 1 AND problem_impact <= 10),
  solution_innovation INTEGER CHECK (solution_innovation >= 1 AND solution_innovation <= 10),
  working_prototype INTEGER CHECK (working_prototype >= 1 AND working_prototype <= 10),
  user_validation INTEGER CHECK (user_validation >= 1 AND user_validation <= 10),
  presentation_quality INTEGER CHECK (presentation_quality >= 1 AND presentation_quality <= 10),
  bioconvergence_alignment INTEGER CHECK (bioconvergence_alignment >= 1 AND bioconvergence_alignment <= 10),

  -- Bonus criteria (boolean checkboxes)
  bonus_cross_disciplinary BOOLEAN DEFAULT FALSE,
  bonus_cross_institutional BOOLEAN DEFAULT FALSE,
  bonus_first_year BOOLEAN DEFAULT FALSE,
  bonus_user_testimonials BOOLEAN DEFAULT FALSE,

  -- Calculated fields
  weighted_score NUMERIC(5,2), -- Auto-calculated
  bonus_percentage NUMERIC(4,2) DEFAULT 0, -- Sum of applicable bonuses
  total_score NUMERIC(5,2), -- weighted_score * (1 + bonus_percentage/100)

  -- Judge notes
  notes TEXT,
  strengths TEXT,
  improvements TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_judge_scores_submission ON judge_scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge ON judge_scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_track ON judge_scores(track_id);

-- ============================================
-- 5. AUDIENCE VOTES TABLE
-- Live audience voting during demos
-- ============================================

CREATE TABLE IF NOT EXISTS audience_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES appathon_submissions(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  voter_identifier TEXT, -- For anonymous: IP hash or session ID

  -- Simple 1-5 star rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Optional: specific reactions
  reaction TEXT CHECK (reaction IN ('love', 'innovative', 'useful', 'polished', 'impactful')),

  -- Metadata
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT,

  -- Prevent duplicate votes
  UNIQUE(submission_id, voter_id),
  UNIQUE(submission_id, voter_identifier)
);

CREATE INDEX IF NOT EXISTS idx_audience_votes_submission ON audience_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_audience_votes_voter ON audience_votes(voter_id);

-- ============================================
-- 6. ENABLE RLS
-- ============================================

ALTER TABLE judging_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_track_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Judging Tracks: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view judging tracks" ON judging_tracks;
CREATE POLICY "Anyone can view judging tracks"
  ON judging_tracks FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage judging tracks" ON judging_tracks;
CREATE POLICY "Admins can manage judging tracks"
  ON judging_tracks FOR ALL
  USING (is_superadmin() OR is_event_admin(event_id));

-- Track Judges: Admins manage, judges can view their own
DROP POLICY IF EXISTS "Judges can view their assignments" ON track_judges;
CREATE POLICY "Judges can view their assignments"
  ON track_judges FOR SELECT
  USING (user_id = auth.uid() OR is_superadmin() OR is_event_admin((SELECT event_id FROM judging_tracks WHERE id = track_id)));

DROP POLICY IF EXISTS "Admins can manage judge assignments" ON track_judges;
CREATE POLICY "Admins can manage judge assignments"
  ON track_judges FOR ALL
  USING (is_superadmin() OR is_event_admin((SELECT event_id FROM judging_tracks WHERE id = track_id)));

-- Submission Track Assignments: Admins manage, public read
DROP POLICY IF EXISTS "Anyone can view track assignments" ON submission_track_assignments;
CREATE POLICY "Anyone can view track assignments"
  ON submission_track_assignments FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage track assignments" ON submission_track_assignments;
CREATE POLICY "Admins can manage track assignments"
  ON submission_track_assignments FOR ALL
  USING (is_superadmin() OR is_event_admin((SELECT event_id FROM judging_tracks WHERE id = track_id)));

-- Judge Scores: Judges can manage their own, admins see all
DROP POLICY IF EXISTS "Judges can view their own scores" ON judge_scores;
CREATE POLICY "Judges can view their own scores"
  ON judge_scores FOR SELECT
  USING (judge_id = auth.uid() OR is_superadmin() OR is_event_admin((SELECT event_id FROM judging_tracks WHERE id = track_id)));

DROP POLICY IF EXISTS "Judges can insert their scores" ON judge_scores;
CREATE POLICY "Judges can insert their scores"
  ON judge_scores FOR INSERT
  WITH CHECK (judge_id = auth.uid());

DROP POLICY IF EXISTS "Judges can update their scores" ON judge_scores;
CREATE POLICY "Judges can update their scores"
  ON judge_scores FOR UPDATE
  USING (judge_id = auth.uid() AND submitted_at IS NULL);

DROP POLICY IF EXISTS "Admins can view all scores" ON judge_scores;
CREATE POLICY "Admins can view all scores"
  ON judge_scores FOR SELECT
  USING (is_superadmin() OR is_event_admin((SELECT event_id FROM judging_tracks WHERE id = track_id)));

-- Audience Votes: Anyone can vote, only admins see results
DROP POLICY IF EXISTS "Anyone can insert votes" ON audience_votes;
CREATE POLICY "Anyone can insert votes"
  ON audience_votes FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view their own votes" ON audience_votes;
CREATE POLICY "Users can view their own votes"
  ON audience_votes FOR SELECT
  USING (voter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all votes" ON audience_votes;
CREATE POLICY "Admins can view all votes"
  ON audience_votes FOR SELECT
  USING (is_superadmin() OR is_event_admin((SELECT event_id FROM appathon_submissions WHERE id = submission_id)));

-- ============================================
-- 8. CALCULATE WEIGHTED SCORE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_judge_score()
RETURNS TRIGGER AS $$
DECLARE
  weighted NUMERIC(5,2);
  bonus NUMERIC(4,2);
BEGIN
  -- Calculate weighted score based on criteria weights
  -- Problem Impact: 20%, Solution Innovation: 20%, Working Prototype: 20%
  -- User Validation: 15%, Presentation Quality: 5%, Bioconvergence: 5%
  -- Note: Audience Score (15%) is calculated separately
  weighted := (
    COALESCE(NEW.problem_impact, 0) * 0.20 +
    COALESCE(NEW.solution_innovation, 0) * 0.20 +
    COALESCE(NEW.working_prototype, 0) * 0.20 +
    COALESCE(NEW.user_validation, 0) * 0.15 +
    COALESCE(NEW.presentation_quality, 0) * 0.05 +
    COALESCE(NEW.bioconvergence_alignment, 0) * 0.05
  ) * (100.0 / 8.5); -- Normalize to 100 (since weights sum to 0.85, not 1.0)

  -- Calculate bonus percentage
  bonus := 0;
  IF NEW.bonus_cross_disciplinary THEN bonus := bonus + 5; END IF;
  IF NEW.bonus_cross_institutional THEN bonus := bonus + 5; END IF;
  IF NEW.bonus_first_year THEN bonus := bonus + 3; END IF;
  IF NEW.bonus_user_testimonials THEN bonus := bonus + 2; END IF;

  NEW.weighted_score := ROUND(weighted, 2);
  NEW.bonus_percentage := bonus;
  NEW.total_score := ROUND(weighted * (1 + bonus / 100), 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_judge_score_trigger ON judge_scores;
CREATE TRIGGER calculate_judge_score_trigger
  BEFORE INSERT OR UPDATE ON judge_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_judge_score();

-- ============================================
-- 9. AGGREGATE SCORES VIEW
-- Combines judge scores + audience votes
-- ============================================

CREATE OR REPLACE VIEW submission_final_scores AS
SELECT
  s.id as submission_id,
  s.submission_number,
  s.app_name,
  s.category,
  s.status,
  sta.track_id,
  jt.name as track_name,

  -- Judge scores (average across judges) - 85% of total
  COALESCE(AVG(js.weighted_score), 0) as avg_judge_score,
  COUNT(DISTINCT js.judge_id) as judge_count,

  -- Audience score - 15% of total
  COALESCE(AVG(av.rating) * 20, 0) as audience_score, -- Convert 1-5 to 0-100
  COUNT(av.id) as vote_count,

  -- Combined final score
  ROUND(
    COALESCE(AVG(js.weighted_score), 0) * 0.85 +
    COALESCE(AVG(av.rating) * 20, 0) * 0.15 +
    COALESCE(AVG(js.bonus_percentage), 0), -- Add bonus as percentage points
  2) as final_score,

  -- Bonus breakdown
  ROUND(COALESCE(AVG(js.bonus_percentage), 0), 2) as avg_bonus

FROM appathon_submissions s
LEFT JOIN submission_track_assignments sta ON sta.submission_id = s.id
LEFT JOIN judging_tracks jt ON jt.id = sta.track_id
LEFT JOIN judge_scores js ON js.submission_id = s.id
LEFT JOIN audience_votes av ON av.submission_id = s.id
WHERE s.status = 'submitted'
GROUP BY s.id, s.submission_number, s.app_name, s.category, s.status, sta.track_id, jt.name;

GRANT SELECT ON submission_final_scores TO authenticated;

-- ============================================
-- 10. TRACK LEADERBOARD VIEW
-- ============================================

CREATE OR REPLACE VIEW track_leaderboards AS
SELECT
  jt.id as track_id,
  jt.name as track_name,
  jt.theme,
  sfs.submission_id,
  sfs.submission_number,
  sfs.app_name,
  sfs.final_score,
  sfs.avg_judge_score,
  sfs.audience_score,
  sfs.vote_count,
  sfs.judge_count,
  sfs.avg_bonus,
  RANK() OVER (PARTITION BY jt.id ORDER BY sfs.final_score DESC) as rank
FROM judging_tracks jt
JOIN submission_final_scores sfs ON sfs.track_id = jt.id
WHERE jt.is_active = TRUE
ORDER BY jt.name, rank;

GRANT SELECT ON track_leaderboards TO authenticated;

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Get judge's assigned track
CREATE OR REPLACE FUNCTION get_judge_track(p_user_id UUID, p_event_id UUID)
RETURNS UUID AS $$
  SELECT jt.id
  FROM track_judges tj
  JOIN judging_tracks jt ON jt.id = tj.track_id
  WHERE tj.user_id = p_user_id AND jt.event_id = p_event_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Get submissions for a judge's track
CREATE OR REPLACE FUNCTION get_judge_submissions(p_user_id UUID, p_event_id UUID)
RETURNS TABLE (
  submission_id UUID,
  submission_number TEXT,
  app_name TEXT,
  category TEXT,
  demo_slot INTEGER,
  scoring_status TEXT,
  my_score NUMERIC
) AS $$
  SELECT
    s.id as submission_id,
    s.submission_number,
    s.app_name,
    s.category,
    sta.demo_slot,
    CASE
      WHEN js.submitted_at IS NOT NULL THEN 'completed'
      WHEN js.id IS NOT NULL THEN 'in_progress'
      ELSE 'pending'
    END as scoring_status,
    js.total_score as my_score
  FROM appathon_submissions s
  JOIN submission_track_assignments sta ON sta.submission_id = s.id
  JOIN judging_tracks jt ON jt.id = sta.track_id
  JOIN track_judges tj ON tj.track_id = jt.id
  LEFT JOIN judge_scores js ON js.submission_id = s.id AND js.judge_id = p_user_id
  WHERE tj.user_id = p_user_id
    AND jt.event_id = p_event_id
    AND s.status = 'submitted'
  ORDER BY sta.demo_slot NULLS LAST, s.submission_number;
$$ LANGUAGE sql STABLE;

-- ============================================
-- 12. UPDATED_AT TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_judging_tracks_updated_at ON judging_tracks;
CREATE TRIGGER update_judging_tracks_updated_at
  BEFORE UPDATE ON judging_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_judge_scores_updated_at ON judge_scores;
CREATE TRIGGER update_judge_scores_updated_at
  BEFORE UPDATE ON judge_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. INITIAL TRACKS FOR APPATHON 2.0
-- ============================================

-- Insert default tracks based on themes
INSERT INTO judging_tracks (event_id, name, theme, description, demo_order)
SELECT
  '003089a3-8b28-4844-9714-b94f9b838462'::UUID,
  theme,
  theme,
  'Judging track for ' || theme || ' submissions',
  ROW_NUMBER() OVER ()
FROM (
  VALUES
    ('Healthcare + AI'),
    ('Education + AI'),
    ('Agriculture + AI'),
    ('Environment + AI'),
    ('Community + AI'),
    ('MyJKKN Data Apps')
) AS themes(theme)
ON CONFLICT (event_id, theme) DO NOTHING;
