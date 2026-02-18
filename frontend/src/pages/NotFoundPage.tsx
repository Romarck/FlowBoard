import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Page not found
        </p>
        <Link
          to="/projects"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
