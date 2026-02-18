import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IssueTypeIcon } from '../issues/IssueTypeIcon';
import { PriorityBadge } from '../issues/PriorityBadge';
import { UserAvatar } from '../ui/UserAvatar';
import type { IssueListItem } from '@/api/issues';
import type { IssueType, IssuePriority } from '@/types/issue';

interface KanbanCardProps {
  issue: IssueListItem;
  onClick: () => void;
}

export function KanbanCard({ issue, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Issue Key */}
      <div className="mb-2 flex items-center gap-2">
        <IssueTypeIcon type={issue.type as IssueType} className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{issue.key}</span>
      </div>

      {/* Title */}
      <p className="mb-3 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
        {issue.title}
      </p>

      {/* Bottom Row: Priority + Assignee + Story Points */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <PriorityBadge priority={issue.priority as IssuePriority} />
        </div>

        <div className="flex items-center gap-2">
          {/* Assignee - shown as small avatar */}
          {issue.assignee_id && (
            <div className="flex-shrink-0">
              <UserAvatar name="" avatarUrl="" size="sm" className="h-5 w-5 text-xs" />
            </div>
          )}

          {/* Story Points */}
          {issue.story_points !== null && (
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-6 text-center">
              {issue.story_points}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
