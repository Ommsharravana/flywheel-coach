import type {
  Provider,
  ProviderResponse,
  ProviderStatus,
  QueryOptions,
  GeminiOAuthCredentials,
} from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const AVAILABLE_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

const DEFAULT_MODEL = 'gemini-2.0-flash';

// Credentials can be either an API key (string) or OAuth credentials (object)
type GeminiCredentials = string | GeminiOAuthCredentials;

export class GeminiProvider implements Provider {
  readonly name = 'gemini';
  private credentials: GeminiCredentials;
  private isApiKey: boolean;
  private onTokenRefresh?: (newCredentials: GeminiOAuthCredentials) => Promise<void>;

  constructor(
    credentials: GeminiCredentials,
    onTokenRefresh?: (newCredentials: GeminiOAuthCredentials) => Promise<void>
  ) {
    this.credentials = credentials;
    this.isApiKey = typeof credentials === 'string';
    this.onTokenRefresh = onTokenRefresh;
  }

  getAvailableModels(): string[] {
    return AVAILABLE_MODELS;
  }

  private getAuthConfig(baseUrl: string): { url: string; headers: Record<string, string> } {
    if (this.isApiKey) {
      // API key auth - append to URL
      const separator = baseUrl.includes('?') ? '&' : '?';
      return {
        url: `${baseUrl}${separator}key=${this.credentials}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };
    } else {
      // OAuth auth - use Bearer token
      const oauthCreds = this.credentials as GeminiOAuthCredentials;
      return {
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${oauthCreds.access_token}`,
        },
      };
    }
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<ProviderResponse> {
    const model = options.model || DEFAULT_MODEL;
    const baseUrl = `${GEMINI_API_BASE}/models/${model}:generateContent`;
    const { url, headers } = this.getAuthConfig(baseUrl);

    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 8192,
        temperature: options.temperature ?? 0.7,
      },
    };

    if (options.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No response from Gemini');
    }

    const content = candidate.content?.parts?.[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return {
      content,
      model,
      tokensUsed,
      finishReason: candidate.finishReason,
    };
  }

  async *queryStream(prompt: string, options: QueryOptions = {}): AsyncGenerator<string, void, unknown> {
    const model = options.model || DEFAULT_MODEL;
    const baseUrl = `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse`;
    const { url, headers } = this.getAuthConfig(baseUrl);

    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 8192,
        temperature: options.temperature ?? 0.7,
      },
    };

    if (options.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
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
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
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

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with a simple request
      await this.query('Say "OK" and nothing else.', {
        model: 'gemini-2.0-flash',
        maxTokens: 10,
      });
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Gemini credential validation failed:', errorMessage);

      // Parse specific error types for better user feedback
      // Check invalid key FIRST (most common error for new users)
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid') || errorMessage.includes('INVALID_ARGUMENT')) {
        return { valid: false, error: 'Invalid API key. Please check and try again.' };
      }
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        return {
          valid: false,
          error: 'Quota exhausted. Wait a minute or check your usage at ai.google.dev/usage'
        };
      }
      if (errorMessage.includes('401')) {
        return { valid: false, error: 'Unauthorized. Please check your API key.' };
      }
      if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
        return { valid: false, error: 'API key lacks permission. Enable the Generative Language API in Google Cloud Console.' };
      }

      return { valid: false, error: 'Could not validate API key. Please try again.' };
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const result = await this.validateCredentials();
    return {
      isConfigured: true,
      isValid: result.valid,
      lastValidated: new Date(),
      provider: this.name,
    };
  }
}

export function parseGeminiCredentials(jsonContent: string): GeminiOAuthCredentials {
  try {
    const parsed = JSON.parse(jsonContent);

    // Handle the simplified format from Supabase OAuth
    if (parsed.access_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token || null,
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
        scopes: parsed.scopes || [],
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
