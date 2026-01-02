'use server';

import { createClient } from '@/lib/supabase/server';

// Vercel API types
export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
  uid: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: string;
  createdAt: number;
}

// OAuth configuration
const VERCEL_OAUTH_URL = 'https://vercel.com/integrations/vibe-studio/new';
const VERCEL_TOKEN_URL = 'https://api.vercel.com/v2/oauth/access_token';
const VERCEL_API_URL = 'https://api.vercel.com';

export async function getVercelOAuthUrl(redirectUri: string): Promise<string> {
  const clientId = process.env.VERCEL_INTEGRATION_ID;

  if (!clientId) {
    throw new Error('VERCEL_INTEGRATION_ID not configured');
  }

  // Vercel uses integration flow, not standard OAuth
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    integration_id: clientId,
  });

  return `${VERCEL_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeVercelCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  token_type: string;
  team_id?: string;
}> {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Vercel OAuth credentials not configured');
  }

  const response = await fetch(VERCEL_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

// Vercel API functions
export async function getVercelUser(accessToken: string): Promise<{ user: { username: string } }> {
  const response = await fetch(`${VERCEL_API_URL}/v2/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

export async function listVercelProjects(accessToken: string, teamId?: string): Promise<{ projects: VercelProject[] }> {
  const url = new URL(`${VERCEL_API_URL}/v9/projects`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function createVercelProject(
  accessToken: string,
  name: string,
  gitRepository: { type: 'github'; repo: string },
  teamId?: string
): Promise<VercelProject> {
  const url = new URL(`${VERCEL_API_URL}/v10/projects`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      gitRepository,
      framework: 'nextjs',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create project');
  }

  return response.json();
}

export async function getDeployment(
  accessToken: string,
  deploymentId: string,
  teamId?: string
): Promise<VercelDeployment> {
  const url = new URL(`${VERCEL_API_URL}/v13/deployments/${deploymentId}`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch deployment');
  }

  return response.json();
}

export async function listDeployments(
  accessToken: string,
  projectId: string,
  teamId?: string
): Promise<{ deployments: VercelDeployment[] }> {
  const url = new URL(`${VERCEL_API_URL}/v6/deployments`);
  url.searchParams.set('projectId', projectId);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch deployments');
  }

  return response.json();
}

// Store/retrieve credentials from database
export async function storeVercelCredentials(
  userId: string,
  accessToken: string,
  teamId?: string,
  teamName?: string
): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any).upsert({
    user_id: userId,
    provider: 'vercel',
    access_token_encrypted: accessToken, // TODO: Encrypt before storing
    refresh_token_encrypted: null,
    expires_at: null,
    metadata: {
      team_id: teamId,
      team_name: teamName,
    },
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,provider',
  });

  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`);
  }
}

export async function getVercelCredentials(userId: string): Promise<{
  accessToken: string;
  teamId?: string;
} | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('byos_connections') as any)
    .select('access_token_encrypted, metadata')
    .eq('user_id', userId)
    .eq('provider', 'vercel')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    accessToken: data.access_token_encrypted,
    teamId: (data.metadata as { team_id?: string })?.team_id,
  };
}

export async function disconnectVercel(userId: string): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('byos_connections') as any)
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'vercel');

  if (error) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
}
