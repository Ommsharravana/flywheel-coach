-- February Challenge Interest Collection
-- Captures interest from potential participants before the event officially opens

-- Interest collection table
CREATE TABLE IF NOT EXISTS challenge_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Interested participant details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,

  -- Interest metadata
  challenge_slug TEXT NOT NULL DEFAULT 'february-2026',
  source TEXT, -- where they heard about it
  goals TEXT, -- what they hope to achieve

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'notified', 'registered', 'unsubscribed')),
  notified_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_email_per_challenge UNIQUE (email, challenge_slug)
);

-- Enable RLS
ALTER TABLE challenge_interest ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can express interest)
CREATE POLICY "Anyone can express interest"
  ON challenge_interest
  FOR INSERT
  WITH CHECK (true);

-- Admin read policy
CREATE POLICY "Admins can view interest"
  ON challenge_interest
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Admin update policy
CREATE POLICY "Admins can update interest"
  ON challenge_interest
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Updated at trigger
CREATE TRIGGER set_challenge_interest_updated_at
  BEFORE UPDATE ON challenge_interest
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_challenge_interest_challenge ON challenge_interest(challenge_slug);
CREATE INDEX idx_challenge_interest_email ON challenge_interest(email);
CREATE INDEX idx_challenge_interest_status ON challenge_interest(status);

-- Function to get interest stats
CREATE OR REPLACE FUNCTION get_challenge_interest_stats(p_challenge_slug TEXT DEFAULT 'february-2026')
RETURNS TABLE (
  total_interested BIGINT,
  by_institution JSONB,
  sources JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_interested,
    (
      SELECT jsonb_agg(jsonb_build_object('institution', institution, 'count', cnt))
      FROM (
        SELECT COALESCE(institution, 'Unknown') AS institution, COUNT(*) AS cnt
        FROM challenge_interest
        WHERE challenge_slug = p_challenge_slug
        GROUP BY institution
        ORDER BY cnt DESC
        LIMIT 10
      ) i
    ) AS by_institution,
    (
      SELECT jsonb_agg(jsonb_build_object('source', source, 'count', cnt))
      FROM (
        SELECT COALESCE(source, 'Direct') AS source, COUNT(*) AS cnt
        FROM challenge_interest
        WHERE challenge_slug = p_challenge_slug
        GROUP BY source
        ORDER BY cnt DESC
      ) s
    ) AS sources
  FROM challenge_interest
  WHERE challenge_slug = p_challenge_slug;
END;
$$;

COMMENT ON TABLE challenge_interest IS 'Collects interest from potential participants for upcoming challenges';
