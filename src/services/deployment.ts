import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function isStaticHtmlSite(directory: string): Promise<boolean> {
  try {
    // Check recursively for index.html
    async function findIndexHtml(dir: string): Promise<boolean> {
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        if (file.isDirectory()) {
          const found = await findIndexHtml(path.join(dir, file.name));
          if (found) return true;
        } else if (file.name.toLowerCase() === 'index.html') {
          return true;
        }
      }
      return false;
    }

    return await findIndexHtml(directory);
  } catch (error) {
    return false;
  }
}

async function findIndexHtmlPath(directory: string): Promise<string | null> {
  try {
    async function findIndex(dir: string): Promise<string | null> {
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          const found = await findIndex(fullPath);
          if (found) return found;
        } else if (file.name.toLowerCase() === 'index.html') {
          return fullPath;
        }
      }
      return null;
    }

    return await findIndex(directory);
  } catch (error) {
    return null;
  }
}

export async function deployRepository({
  owner,
  repo,
  subdomain,
  accessToken,
}: {
  owner: string;
  repo: string;
  subdomain: string;
  accessToken: string;
}) {
  const baseDir = process.env.DEPLOYMENT_BASE_DIR || path.join(process.cwd(), 'deployments');
  const deployDir = path.join(baseDir, subdomain);
  const repoUrl = `https://x-access-token:${accessToken}@github.com/${owner}/${repo}.git`;

  try {
    // Clean up and create directory
    await fs.rm(deployDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(deployDir, { recursive: true });

    console.log(`Cloning repository: ${owner}/${repo}`);
    await execAsync(`git clone "${repoUrl}" "${deployDir}"`);

    const packageJsonPath = path.join(deployDir, 'package.json');
    const hasPackageJson = await fs.access(packageJsonPath).then(() => true).catch(() => false);

    if (!hasPackageJson) {
      throw new Error('No package.json found');
    }

    console.log('Reading package.json...');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    if (!packageJson.dependencies?.next) {
      throw new Error('Not a Next.js project');
    }

    console.log('Next.js project detected, configuring...');

    // Create next.config.js
    const nextConfigContent = `
      /** @type {import('next').NextConfig} */
      const nextConfig = {
        output: 'export',
        images: {
          unoptimized: true,
          remotePatterns: [
            {
              protocol: 'https',
              hostname: '**',
            },
          ],
        },
        trailingSlash: true,
      };

      module.exports = nextConfig;
    `;

    await fs.writeFile(
      path.join(deployDir, 'next.config.js'),
      nextConfigContent.trim()
    );

    // Install dependencies
    console.log('Installing dependencies...');
    await execAsync('npm install --legacy-peer-deps', {
      cwd: deployDir,
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Build the project
    console.log('Building Next.js project...');
    await execAsync('npm run build', {
      cwd: deployDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    });

    // Update browserlist database
    await execAsync('npx update-browserslist-db@latest', {
      cwd: deployDir
    });

    const buildDir = path.join(deployDir, 'out');
    const exists = await fs.access(buildDir).then(() => true).catch(() => false);

    if (!exists) {
      throw new Error('Build failed - no output directory found');
    }

    // Configure nginx
    const domain = process.env.DOMAIN || 'deployme.online';
    const nginxSitesDir = process.env.NGINX_SITES_DIR || 'C:\\nginx\\conf\\sites-available';
    const nginxEnabledDir = process.env.NGINX_ENABLED_DIR || 'C:\\nginx\\conf\\sites-enabled';

    // Windows-compatible nginx config
    const nginxConfig = `
server {
    listen 80;
    server_name ${subdomain}.${domain};

    root ${buildDir.replace(/\\/g, '/')};
    index index.html;

    # Handle Next.js static files
    location /_next/static {
        alias ${buildDir.replace(/\\/g, '/')}/_next/static;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Handle other static files
    location /static {
        expires 1y;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Handle Next.js routing
    location / {
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}`;

    const nginxConfigPath = path.join(nginxSitesDir, `${subdomain}.${domain}.conf`);
    await fs.mkdir(nginxSitesDir, { recursive: true });
    await fs.writeFile(nginxConfigPath, nginxConfig);

    // Create sites-enabled directory if it doesn't exist
    await fs.mkdir(nginxEnabledDir, { recursive: true });

    // Create symlink (on Windows, requires running as administrator)
    const nginxEnabledPath = path.join(nginxEnabledDir, `${subdomain}.${domain}.conf`);
    try {
      await fs.symlink(nginxConfigPath, nginxEnabledPath);
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        // If symlink fails, try to copy the file instead
        await fs.copyFile(nginxConfigPath, nginxEnabledPath);
      }
    }

    // Reload nginx using Windows commands
    try {
      await execAsync('net stop nginx');
      await execAsync('net start nginx');
    } catch (error) {
      console.error('Failed to restart nginx:', error);
      // Try alternative method
      await execAsync('nginx -s reload');
    }

    return {
      success: true,
      url: `https://${subdomain}.${domain}`,
      deployDir,
      publicDir: buildDir
    };

  } catch (error: any) {
    console.error('Deployment error:', {
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });

    // Clean up on failure
    try {
      await fs.rm(deployDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    throw error;
  }
}