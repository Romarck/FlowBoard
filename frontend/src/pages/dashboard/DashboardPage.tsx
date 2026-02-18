import { BarChart3 } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Open Issues', 'In Progress', 'Done This Sprint', 'Team Members'].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                --
              </p>
            </div>
          )
        )}
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Charts coming soon
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Dashboard charts will be available in Story E10.
        </p>
      </div>
    </div>
  );
}
