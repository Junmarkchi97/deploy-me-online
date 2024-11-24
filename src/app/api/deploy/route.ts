import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Octokit } from '@octokit/rest';
import { authOptions } from '../auth/[...nextauth]/route';

// Helper function to validate and extract repo info from GitHub URL
function parseGitHubUrl(url: string) {
  try {
    const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
    const matches = url.match(githubRegex);
    if (!matches) throw new Error('Invalid GitHub URL');
    return {
      owner: matches[1],
      repo: matches[2].replace('.git', ''),
    };
  } catch (error) {
    throw new Error('Invalid GitHub URL format');
  }
}

// Helper function to validate subdomain
function validateSubdomain(subdomain: string) {
  const subdomainRegex = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
  if (!subdomainRegex.test(subdomain)) {
    throw new Error('Invalid subdomain format');
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repoUrl, subdomain } = await request.json();

    // Validate inputs
    if (!repoUrl || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subdomain format
    validateSubdomain(subdomain);

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Check if repository exists and user has access
    try {
      await octokit.repos.get({
        owner,
        repo,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Repository not found or no access' },
        { status: 404 }
      );
    }

    // TODO: Check if subdomain is available in your database
    // const isSubdomainAvailable = await checkSubdomainAvailability(subdomain);
    // if (!isSubdomainAvailable) {
    //   return NextResponse.json(
    //     { error: 'Subdomain is already taken' },
    //     { status: 400 }
    //   );
    // }

    // Start deployment process
    // 1. Clone repository
    // 2. Build static files
    // 3. Deploy to hosting service
    // 4. Set up subdomain

    // For now, we'll just queue a deployment job
    await queueDeployment({
      owner,
      repo,
      subdomain,
      accessToken: session.accessToken,
    });

    return NextResponse.json({
      success: true,
      message: 'Deployment started',
      deploymentUrl: `https://${subdomain}.yourdomain.com`,
      details: {
        owner,
        repo,
        subdomain,
      }
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start deployment' },
      { status: error.status || 500 }
    );
  }
}

// Helper function to queue deployment
async function queueDeployment(deploymentInfo: {
  owner: string;
  repo: string;
  subdomain: string;
  accessToken: string;
}) {
  // TODO: Implement actual deployment queue
  // This could be:
  // 1. A message queue (Redis, RabbitMQ, etc.)
  // 2. A database record
  // 3. A serverless function trigger

  console.log('Queuing deployment:', deploymentInfo);

  // For now, we'll just log the deployment info
  return true;
}