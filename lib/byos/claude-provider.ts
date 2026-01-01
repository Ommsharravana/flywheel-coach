import type {
  Provider,
  ProviderResponse,
  ProviderStatus,
  QueryOptions,
} from './types';

const CLAUDE_API_BASE = 'https://api.anthropic.com/v1';

const AVAILABLE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
];

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export interface ClaudeOAuthCredentials {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_at?: number; // Unix timestamp
  scope?: string;
}

export class ClaudeProvider implements Provider {
  readonly name = 'claude';
  private credentials: ClaudeOAuthCredentials;
  private onTokenRefresh?: (newCredentials: ClaudeOAuthCredentials) => Promise<void>;

  constructor(
    credentials: ClaudeOAuthCredentials,
    onTokenRefresh?: (newCredentials: ClaudeOAuthCredentials) => Promise<void>
  ) {
    this.credentials = credentials;
    this.onTokenRefresh = onTokenRefresh;
  }

  getAvailableModels(): string[] {
    return AVAILABLE_MODELS;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    // Check if token is expired or about to expire (within 5 minutes)
    if (this.credentials.expires_at) {
      const expiresAt = this.credentials.expires_at * 1000; // Convert to ms
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now >= expiresAt - fiveMinutes && this.credentials.refresh_token) {
        await this.refreshAccessToken();
      }
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials.refresh_token) {
      throw new Error('No refresh token available');
    }

    const clientId = process.env.CLAUDE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new Error('Claude OAuth not configured');
    }

    const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refresh_token,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    this.credentials = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || this.credentials.refresh_token,
      token_type: data.token_type || 'Bearer',
      expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
      scope: data.scope,
    };

    // Notify about token refresh so it can be persisted
    if (this.onTokenRefresh) {
      await this.onTokenRefresh(this.credentials);
    }
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<ProviderResponse> {
    await this.refreshTokenIfNeeded();

    const model = options.model || DEFAULT_MODEL;
    const url = `${CLAUDE_API_BASE}/messages`;

    const messages = [{ role: 'user', content: prompt }];

    const requestBody: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens || 4096,
      messages,
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.access_token}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();

    const content = data.content?.[0]?.text || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return {
      content,
      model,
      tokensUsed,
      finishReason: data.stop_reason,
    };
  }

  async *queryStream(prompt: string, options: QueryOptions = {}): AsyncGenerator<string, void, unknown> {
    await this.refreshTokenIfNeeded();

    const model = options.model || DEFAULT_MODEL;
    const url = `${CLAUDE_API_BASE}/messages`;

    const messages = [{ role: 'user', content: prompt }];

    const requestBody: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens || 4096,
      messages,
      stream: true,
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.access_token}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'content_block_delta' && data.delta?.text) {
                yield data.delta.text;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.query('Say "OK" and nothing else.', {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      console.error('Claude credential validation failed:', error);
      return false;
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const isValid = await this.validateCredentials();
    return {
      isConfigured: true,
      isValid,
      lastValidated: new Date(),
      expiresAt: this.credentials.expires_at
        ? new Date(this.credentials.expires_at * 1000)
        : undefined,
      provider: this.name,
    };
  }
}

export function parseClaudeCredentials(jsonContent: string): ClaudeOAuthCredentials {
  try {
    const parsed = JSON.parse(jsonContent);

    if (parsed.access_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token || null,
        token_type: parsed.token_type || 'Bearer',
        expires_at: parsed.expires_at,
        scope: parsed.scope,
      };
    }

    throw new Error('Invalid credentials format');
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
