import { IssueTypeIcon } from './IssueTypeIcon';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { IssueListItem } from '@/api/issues';
import type { IssueType, IssuePriority } from '@/types/issue';
import type { WorkflowStatus } from '@/types/project';
import type { User } from '@/types/auth';

interface IssueRowProps {
  issue: IssueListItem;
  status?: WorkflowStatus;
  assignee?: User | null;
  onClick: () => void;
}

export function IssueRow({ issue, status, assignee, onClick }: IssueRowProps) {
  // Get a status badge color based on status_id if status object is not provided
  const getStatusBadge = () => {
    if (status) {
      return <StatusBadge status={status} />;
    }
    // Fallback: just show the status_id
    return <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{issue.status_id}</span>;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
    >
      {/* Issue Type Icon */}
      <IssueTypeIcon type={issue.type as IssueType} className="h-4 w-4 flex-shrink-0" />

      {/* Issue Key & Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400 flex-shrink-0">{issue.key}</span>
          <span className="text-sm text-gray-900 dark:text-white truncate">{issue.title}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">{getStatusBadge()}</div>

      {/* Priority Badge */}
      <div className="flex-shrink-0">
        <PriorityBadge priority={issue.priority as IssuePriority} />
      </div>

      {/* Assignee Avatar */}
      {assignee && <UserAvatar name={assignee.name} avatarUrl={assignee.avatar_url} size="sm" />}

      {/* Story Points */}
      {issue.story_points !== null && (
        <div className="flex-shrink-0 text-sm font-semibold text-gray-600 dark:text-gray-400 w-8 text-center">
          {issue.story_points}
        </div>
      )}
    </div>
  );
}
