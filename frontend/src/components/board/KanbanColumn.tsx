import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { IssueListItem } from '@/api/issues';
import type { WorkflowStatus } from '@/types/project';

interface KanbanColumnProps {
  status: WorkflowStatus;
  issues: IssueListItem[];
  onIssueClick: (issue: IssueListItem) => void;
}

export function KanbanColumn({ status, issues, onIssueClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {status.name}
        </h3>
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
          {issues.length}
        </span>
      </div>

      {/* Droppable Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border-2 p-3 transition-colors ${
          isOver
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
            : 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
        }`}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <KanbanCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick(issue)}
                />
              ))
            ) : (
              <div className="flex min-h-[100px] items-center justify-center rounded-md text-xs text-gray-400 dark:text-gray-500">
                Drop issues here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
