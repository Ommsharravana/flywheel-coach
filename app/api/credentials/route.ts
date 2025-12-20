import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  encrypt,
  decrypt,
  GeminiProvider,
  parseGeminiCredentials,
  isEncryptionConfigured,
} from '@/lib/byos';
import type { StoredCredentials, GeminiOAuthCredentials } from '@/lib/byos';

// GET /api/credentials - List user's configured providers
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: credentials, error } = await (supabase as any)
      .from('provider_credentials')
      .select('id, provider, credential_type, is_valid, last_validated_at, expires_at, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    // Return provider info without the actual credentials
    const providers = (credentials || []).map(
      (cred: Omit<StoredCredentials, 'user_id' | 'credentials_encrypted' | 'updated_at'>) => ({
        id: cred.id,
        provider: cred.provider,
        credentialType: cred.credential_type,
        isValid: cred.is_valid,
        lastValidated: cred.last_validated_at,
        expiresAt: cred.expires_at,
        createdAt: cred.created_at,
      })
    );

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error in GET /api/credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/credentials - Store new credentials
export async function POST(request: NextRequest) {
  try {
    if (!isEncryptionConfigured()) {
      return NextResponse.json(
        { error: 'Encryption not configured. Contact administrator.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, credentials, credentialType } = body;

    // Validate provider
    if (!provider || !['claude', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "claude" or "gemini"' },
        { status: 400 }
      );
    }

    // Validate credential type
    if (!credentialType || !['token', 'oauth_json'].includes(credentialType)) {
      return NextResponse.json(
        { error: 'Invalid credentialType. Must be "token" or "oauth_json"' },
        { status: 400 }
      );
    }

    if (!credentials) {
      return NextResponse.json({ error: 'Credentials are required' }, { status: 400 });
    }

    // Validate and test credentials based on provider
    let isValid = false;
    let expiresAt: string | null = null;

    if (provider === 'gemini') {
      try {
        const geminiCreds = parseGeminiCredentials(
          typeof credentials === 'string' ? credentials : JSON.stringify(credentials)
        );

        // Test the credentials
        const geminiProvider = new GeminiProvider(geminiCreds);
        isValid = await geminiProvider.validateCredentials();

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid Gemini credentials. Please check and try again.' },
            { status: 400 }
          );
        }

        // Set expiry if available
        if (geminiCreds.expiry) {
          expiresAt = geminiCreds.expiry;
        }
      } catch (error) {
        console.error('Gemini credential validation error:', error);
        return NextResponse.json(
          { error: `Invalid credentials: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

    // Encrypt credentials
    const credentialsString = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);
    const encryptedCredentials = encrypt(credentialsString);

    // Upsert credentials (insert or update if exists)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('provider_credentials')
      .upsert(
        {
          user_id: user.id,
          provider,
          credentials_encrypted: encryptedCredentials,
          credential_type: credentialType,
          is_valid: isValid,
          last_validated_at: new Date().toISOString(),
          expires_at: expiresAt,
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select('id, provider, is_valid, created_at')
      .single();

    if (error) {
      console.error('Error storing credentials:', error);
      return NextResponse.json({ error: 'Failed to store credentials' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: data.provider,
      isValid: data.is_valid,
      message: `${provider} credentials stored successfully`,
    });
  } catch (error) {
    console.error('Error in POST /api/credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/credentials - Remove credentials
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider || !['claude', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "claude" or "gemini"' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('provider_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error('Error deleting credentials:', error);
      return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${provider} credentials removed`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get decrypted credentials for a user
export async function getUserCredentials(
  userId: string,
  provider: 'claude' | 'gemini'
): Promise<GeminiOAuthCredentials | string | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('provider_credentials')
    .select('credentials_encrypted, credential_type, is_valid')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }

  if (!data.is_valid) {
    return null;
  }

  try {
    const decrypted = decrypt(data.credentials_encrypted);

    if (provider === 'gemini' && data.credential_type === 'oauth_json') {
      return parseGeminiCredentials(decrypted);
    }

    return decrypted;
  } catch (error) {
    console.error('Error decrypting credentials:', error);
    return null;
  }
}
