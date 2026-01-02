-- BYOS (Bring Your Own Stack) Connections
-- Stores OAuth tokens for Supabase, GitHub, and Vercel integrations

CREATE TABLE IF NOT EXISTS byos_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('supabase', 'github', 'vercel')),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only have one connection per provider
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE byos_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
    ON byos_connections FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own connections"
    ON byos_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own connections"
    ON byos_connections FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections"
    ON byos_connections FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_byos_connections_user_provider
    ON byos_connections(user_id, provider);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_byos_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_byos_connections_updated_at
    BEFORE UPDATE ON byos_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_byos_connections_updated_at();

-- Comment for documentation
COMMENT ON TABLE byos_connections IS 'Stores OAuth tokens for BYOS (Bring Your Own Stack) integrations - Supabase, GitHub, Vercel';
