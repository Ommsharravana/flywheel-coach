'use server';

import { createClient } from '@/lib/supabase/server';

// Supabase Management API types
export interface SupabaseProject {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  created_at: string;
  database: {
    host: string;
    version: string;
  };
  status: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
  billing_email: string;
}

// OAuth configuration
const SUPABASE_OAUTH_URL = 'https://api.supabase.com/v1/oauth/authorize';
const SUPABASE_TOKEN_URL = 'https://api.supabase.com/v1/oauth/token';
const SUPABASE_API_URL = 'https://api.supabase.com/v1';

export async function getSupabaseOAuthUrl(redirectUri: string): Promise<string> {
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error('SUPABASE_OAUTH_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'all', // Full access to manage projects
  });

  return `${SUPABASE_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeSupabaseCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Supabase OAuth credentials not configured');
  }

  const response = await fetch(SUPABASE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

export async function refreshSupabaseToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Supabase OAuth credentials not configured');
  }

  const response = await fetch(SUPABASE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

// Management API functions
export async function listSupabaseOrganizations(accessToken: string): Promise<SupabaseOrganization[]> {
  const response = await fetch(`${SUPABASE_API_URL}/organizations`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return response.json();
}

export async function listSupabaseProjects(accessToken: string): Promise<SupabaseProject[]> {
  const response = await fetch(`${SUPABASE_API_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function getSupabaseProject(accessToken: string, projectRef: string): Promise<SupabaseProject> {
  const response = await fetch(`${SUPABASE_API_URL}/projects/${projectRef}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }

  return response.json();
}

// Store/retrieve credentials from database
export async function storeSupabaseCredentials(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any).upsert({
    user_id: userId,
    provider: 'supabase',
    access_token_encrypted: accessToken,
    refresh_token_encrypted: refreshToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,provider',
  });

  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`);
  }
}

export async function getSupabaseCredentials(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
} | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('byos_connections') as any)
    .select('access_token_encrypted, refresh_token_encrypted, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'supabase')
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token expired and refresh if needed
  if (new Date(data.expires_at) < new Date()) {
    try {
      const newTokens = await refreshSupabaseToken(data.refresh_token_encrypted);
      await storeSupabaseCredentials(
        userId,
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_in
      );
      return {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        expiresAt: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      };
    } catch {
      return null; // Token refresh failed, user needs to re-auth
    }
  }

  return {
    accessToken: data.access_token_encrypted,
    refreshToken: data.refresh_token_encrypted,
    expiresAt: data.expires_at,
  };
}

export async function disconnectSupabase(userId: string): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any)
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'supabase');

  if (error) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
}
