'use server';

import { createClient } from '@/lib/supabase/server';

// GitHub API types
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

// OAuth configuration
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';

export async function getGitHubOAuthUrl(redirectUri: string): Promise<string> {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error('GITHUB_OAUTH_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo user:email', // Access to repos and user email
    state: crypto.randomUUID(), // CSRF protection
  });

  return `${GITHUB_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data;
}

// GitHub API functions
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

export async function listGitHubRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repos');
  }

  return response.json();
}

export async function createGitHubRepo(
  accessToken: string,
  name: string,
  description?: string,
  isPrivate = true
): Promise<GitHubRepo> {
  const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true, // Initialize with README
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create repo');
  }

  return response.json();
}

export async function pushFileToGitHub(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch = 'main',
  sha?: string // Required for updating existing files
): Promise<void> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to push file');
  }
}

// Store/retrieve credentials from database
export async function storeGitHubCredentials(
  userId: string,
  accessToken: string,
  username: string
): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any).upsert({
    user_id: userId,
    provider: 'github',
    access_token_encrypted: accessToken,
    refresh_token_encrypted: null,
    expires_at: null,
    metadata: { username },
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,provider',
  });

  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`);
  }
}

export async function getGitHubCredentials(userId: string): Promise<{
  accessToken: string;
  username: string;
} | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('byos_connections') as any)
    .select('access_token_encrypted, metadata')
    .eq('user_id', userId)
    .eq('provider', 'github')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    accessToken: data.access_token_encrypted,
    username: (data.metadata as { username: string })?.username || '',
  };
}

export async function disconnectGitHub(userId: string): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any)
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'github');

  if (error) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
}
