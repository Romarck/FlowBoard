import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Placeholder forgot password page (Story E1.3)
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="you@example.com"
              disabled
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
