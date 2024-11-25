import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import LoginButton from '../../components/LoginButton';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // Redirect to home if already logged in
  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to DeployMe
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Deploy your static sites with ease using your GitHub account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <LoginButton />
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              By signing in, you'll be able to:
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Deploy your GitHub repositories
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Get a free subdomain for each project
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Manage your deployments
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}