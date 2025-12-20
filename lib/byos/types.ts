export interface QueryOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ProviderResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
}

export interface ProviderStatus {
  isConfigured: boolean;
  isValid: boolean;
  lastValidated?: Date;
  expiresAt?: Date;
  provider: string;
}

export interface Provider {
  readonly name: string;
  query(prompt: string, options?: QueryOptions): Promise<ProviderResponse>;
  queryStream?(prompt: string, options?: QueryOptions): AsyncGenerator<string, void, unknown>;
  validateCredentials(): Promise<boolean>;
  getStatus(): Promise<ProviderStatus>;
  getAvailableModels(): string[];
}

export interface GeminiOAuthCredentials {
  access_token: string;
  refresh_token: string | null;
  token_uri: string;
  scopes?: string[];
  // Optional fields for direct OAuth flow
  client_id?: string;
  client_secret?: string;
  expiry?: string;
}

export interface StoredCredentials {
  id: string;
  user_id: string;
  provider: 'claude' | 'gemini';
  credentials_encrypted: string;
  credential_type: 'token' | 'oauth_json';
  is_valid: boolean;
  last_validated_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
