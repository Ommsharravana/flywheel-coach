-- Add 'api_key' to credential_type allowed values
-- The original migration (007) only allowed 'token' and 'oauth_json'
-- But the API code now supports 'api_key' for Gemini API keys

-- Drop the existing check constraint and add a new one with 'api_key' included
ALTER TABLE provider_credentials
DROP CONSTRAINT IF EXISTS provider_credentials_credential_type_check;

ALTER TABLE provider_credentials
ADD CONSTRAINT provider_credentials_credential_type_check
CHECK (credential_type IN ('token', 'oauth_json', 'api_key'));

-- Comment update
COMMENT ON TABLE provider_credentials IS 'Stores encrypted AI provider credentials for BYOS feature (tokens, OAuth JSON, or API keys)';
