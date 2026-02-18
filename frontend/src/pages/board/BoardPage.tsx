import { LayoutDashboard } from 'lucide-react';

export function BoardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Board
      </h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {['To Do', 'In Progress', 'In Review', 'Done'].map((column) => (
          <div
            key={column}
            className="w-72 shrink-0 rounded-lg border border-gray-200 bg-gray-100 p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {column}
            </h3>
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
              <LayoutDashboard className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-xs text-gray-400">
                Drag & drop coming in E4
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
