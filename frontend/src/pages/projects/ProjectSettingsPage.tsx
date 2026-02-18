import { Settings } from 'lucide-react';

export function ProjectSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Project Settings
      </h1>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Settings placeholder
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Project settings will be available in Story E2.
        </p>
      </div>
    </div>
  );
}
