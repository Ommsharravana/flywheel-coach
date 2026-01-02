import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getGitHubCredentials,
  createGitHubRepo,
  pushFileToGitHub,
  listGitHubRepos,
} from '@/lib/byos/github-provider';
import {
  getVercelCredentials,
  createVercelProject,
  listDeployments,
} from '@/lib/byos/vercel-provider';

interface DeployFile {
  path: string;
  content: string;
}

interface DeployRequest {
  projectName: string;
  files: DeployFile[];
  createNew?: boolean;
}

// POST: Deploy files to GitHub and trigger Vercel deployment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectName, files, createNew = false }: DeployRequest = await request.json();

    if (!projectName || !files || files.length === 0) {
      return Response.json({ error: 'Project name and files are required' }, { status: 400 });
    }

    // Get BYOS credentials
    const githubCreds = await getGitHubCredentials(user.id);
    const vercelCreds = await getVercelCredentials(user.id);

    if (!githubCreds) {
      return Response.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    if (!vercelCreds) {
      return Response.json({ error: 'Vercel not connected' }, { status: 400 });
    }

    // Sanitize project name for repo
    const repoName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let repo;

    // Check if repo exists or create new
    if (createNew) {
      try {
        repo = await createGitHubRepo(
          githubCreds.accessToken,
          repoName,
          `Built with JKKN Vibe Studio - ${projectName}`,
          true // private
        );
      } catch (error: unknown) {
        // Repo might already exist
        if (error instanceof Error && error.message.includes('already exists')) {
          const repos = await listGitHubRepos(githubCreds.accessToken);
          repo = repos.find(r => r.name === repoName);
        } else {
          throw error;
        }
      }
    } else {
      const repos = await listGitHubRepos(githubCreds.accessToken);
      repo = repos.find(r => r.name === repoName);
    }

    if (!repo) {
      // Create if doesn't exist
      repo = await createGitHubRepo(
        githubCreds.accessToken,
        repoName,
        `Built with JKKN Vibe Studio - ${projectName}`,
        true
      );
    }

    // Push files to GitHub
    const commitMessage = `Update from JKKN Vibe Studio - ${new Date().toISOString()}`;

    // Push each file
    for (const file of files) {
      await pushFileToGitHub(
        githubCreds.accessToken,
        githubCreds.username,
        repo.name,
        file.path,
        file.content,
        commitMessage,
        'main'
      );
    }

    // Create or get Vercel project linked to this repo
    let vercelProject;
    try {
      vercelProject = await createVercelProject(
        vercelCreds.accessToken,
        repoName,
        {
          type: 'github',
          repo: `${githubCreds.username}/${repo.name}`,
        },
        vercelCreds.teamId
      );
    } catch (error: unknown) {
      // Project might already exist
      if (error instanceof Error && error.message.includes('already linked')) {
        // Project exists, just trigger redeploy by pushing
        console.log('Vercel project already exists, deployment will trigger automatically');
      } else if (error instanceof Error && !error.message.includes('already exists')) {
        throw error;
      }
    }

    // Wait a moment for Vercel to detect the push
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the latest deployment
    let deploymentUrl = null;
    if (vercelProject) {
      try {
        const { deployments } = await listDeployments(
          vercelCreds.accessToken,
          vercelProject.id,
          vercelCreds.teamId
        );
        if (deployments && deployments.length > 0) {
          const latest = deployments[0];
          deploymentUrl = `https://${latest.url}`;
        }
      } catch {
        // Deployment might not be ready yet
        console.log('Could not fetch deployment status');
      }
    }

    return Response.json({
      success: true,
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
      },
      vercel: {
        projectId: vercelProject?.id,
        deploymentUrl,
      },
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    );
  }
}

// GET: Check deployment status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const vercelCreds = await getVercelCredentials(user.id);
    if (!vercelCreds) {
      return Response.json({ error: 'Vercel not connected' }, { status: 400 });
    }

    const { deployments } = await listDeployments(
      vercelCreds.accessToken,
      projectId,
      vercelCreds.teamId
    );

    if (!deployments || deployments.length === 0) {
      return Response.json({
        status: 'pending',
        message: 'No deployments found',
      });
    }

    const latest = deployments[0];

    return Response.json({
      status: latest.state.toLowerCase(),
      url: latest.state === 'READY' ? `https://${latest.url}` : null,
      createdAt: latest.createdAt,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return Response.json(
      { error: 'Failed to check deployment status' },
      { status: 500 }
    );
  }
}
