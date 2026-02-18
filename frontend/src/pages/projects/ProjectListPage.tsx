import { FolderKanban, Plus } from 'lucide-react';

export function ProjectListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Projects
        </h1>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
        <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No projects yet
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Project creation will be available in Story E2.1.
        </p>
      </div>
    </div>
  );
}
