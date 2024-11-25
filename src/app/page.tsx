import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import Image from "next/image";
import DeploymentForm from "../components/DeploymentForm";
import { Providers } from "./providers";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  return (
    <Providers>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center max-w-2xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Deploy Your Static Site
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Host your static GitHub projects instantly with a custom subdomain.
              Sign in with GitHub to get started.
            </p>
          </div>

          <div className="w-full max-w-md">
            <DeploymentForm />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2">Quick Setup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Login with GitHub and deploy in seconds. No complex configuration needed.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2">Custom Domain</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a free subdomain for your project or use your own custom domain.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2">Auto Updates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your site automatically updates when you push to your repository.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg w-full max-w-2xl">
            <h2 className="font-semibold mb-3">Supported Project Types:</h2>
            <ul className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Static HTML/CSS/JS
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                React Builds
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Next.js Static
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vue.js Static
              </li>
            </ul>
          </div>
        </main>

        <footer className="row-start-3 text-sm text-gray-500 dark:text-gray-400 text-center">
          Deploy your projects with confidence • Powered by Your Platform
        </footer>
      </div>
    </Providers>
  );
}
