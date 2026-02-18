import { Zap } from 'lucide-react';

export function SprintPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Sprints
      </h1>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
        <Zap className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No sprints yet
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sprint management will be available in Story E6.
        </p>
      </div>
    </div>
  );
}
