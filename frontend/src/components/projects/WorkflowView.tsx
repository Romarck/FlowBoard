import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStatuses } from '@/hooks/useProjects';

const CATEGORY_STYLES: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function WorkflowView({ projectId }: { projectId: string }) {
  const { data: statuses, isLoading } = useStatuses(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const statusList = statuses || [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Workflow statuses are created automatically for each project and cannot be edited in this version.
      </p>
      {statusList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No workflow statuses found.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {statusList.map((status, idx) => (
            <div
              key={status.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-card p-3 dark:border-gray-700"
            >
              <span className="w-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {idx + 1}
              </span>
              <span className="flex-1 font-medium text-gray-900 dark:text-white">
                {status.name}
              </span>
              <Badge className={CATEGORY_STYLES[status.category] || ''} variant="secondary">
                {CATEGORY_LABELS[status.category] || status.category}
              </Badge>
              {status.wip_limit && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  WIP: {status.wip_limit}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
