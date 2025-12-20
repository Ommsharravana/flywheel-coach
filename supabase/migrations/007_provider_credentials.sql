-- Provider Credentials for BYOS (Bring Your Own Subscription)
-- Allows users to use their own AI provider subscriptions (Gemini Pro, etc.)

-- Create provider_credentials table
CREATE TABLE IF NOT EXISTS provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'gemini')),
  credentials_encrypted TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('token', 'oauth_json')),
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_provider_credentials_user_id ON provider_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_provider ON provider_credentials(provider);

-- Enable RLS
ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own credentials
CREATE POLICY "Users can view own credentials"
  ON provider_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON provider_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON provider_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON provider_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Usage logs for tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS provider_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  tokens_used INT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage logs
CREATE INDEX IF NOT EXISTS idx_provider_usage_logs_user_id ON provider_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_usage_logs_created_at ON provider_usage_logs(created_at);

-- Enable RLS for usage logs
ALTER TABLE provider_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage logs"
  ON provider_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage logs
CREATE POLICY "Service can insert usage logs"
  ON provider_usage_logs FOR INSERT
  WITH CHECK (true);

-- Updated at trigger for provider_credentials
CREATE OR REPLACE FUNCTION update_provider_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_provider_credentials_updated_at
  BEFORE UPDATE ON provider_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_credentials_updated_at();

-- Comment
COMMENT ON TABLE provider_credentials IS 'Stores encrypted AI provider credentials for BYOS feature';
COMMENT ON TABLE provider_usage_logs IS 'Tracks AI provider usage for analytics';
