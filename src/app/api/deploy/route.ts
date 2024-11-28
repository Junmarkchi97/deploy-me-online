import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Octokit } from 'octokit';
import { authOptions } from '../auth/[...nextauth]/route';
import { deployRepository } from '@/services/deployment';

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
      await octokit.rest.repos.get({
        owner,
        repo,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Repository not found or no access' },
        { status: 404 }
      );
    }

    // Deploy the repository
    const deploymentResult = await deployRepository({
      owner,
      repo,
      subdomain,
      accessToken: session.accessToken!,
    });

    return NextResponse.json({
      success: true,
      message: 'Deployment completed',
      deploymentUrl: `https://${subdomain}.deployme.online`,
      details: {
        owner,
        repo,
        subdomain,
      }
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy' },
      { status: error.status || 500 }
    );
  }
}