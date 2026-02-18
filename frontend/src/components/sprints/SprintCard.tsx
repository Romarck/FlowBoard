import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Trash2, ChevronDown, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Sprint } from '@/types/sprint';
import { useStartSprint, useCompleteSprint, useDeleteSprint } from '@/hooks/useSprints';
import { useState } from 'react';
import { IssueRow } from '@/components/issues/IssueRow';
import type { IssueListItem } from '@/types/issue';

interface SprintCardProps {
  projectId: string;
  sprint: Sprint;
  issues?: IssueListItem[];
  isActive?: boolean;
  onAddIssues?: () => void;
}

export function SprintCard({
  projectId,
  sprint,
  issues = [],
  isActive = false,
  onAddIssues,
}: SprintCardProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const startSprint = useStartSprint(projectId);
  const completeSprint = useCompleteSprint(projectId);
  const deleteSprint = useDeleteSprint(projectId);

  const handleStart = async () => {
    try {
      await startSprint.mutateAsync(sprint.id);
    } catch (error) {
      console.error('Failed to start sprint:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await completeSprint.mutateAsync(sprint.id);
    } catch (error) {
      console.error('Failed to complete sprint:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will delete the sprint.')) return;
    try {
      await deleteSprint.mutateAsync(sprint.id);
    } catch (error) {
      console.error('Failed to delete sprint:', error);
    }
  };

  const dateRange =
    sprint.start_date && sprint.end_date
      ? `${format(parseISO(sprint.start_date), 'MMM d', { locale: ptBR })} - ${format(
          parseISO(sprint.end_date),
          'MMM d, yyyy',
          { locale: ptBR }
        )}`
      : sprint.start_date
        ? format(parseISO(sprint.start_date), 'MMM d, yyyy', { locale: ptBR })
        : 'No dates set';

  const statusColor =
    sprint.status === 'active'
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      : sprint.status === 'completed'
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';

  return (
    <div
      className={`border-l-4 rounded-lg p-4 ${statusColor} transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
              />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {sprint.name}
            </h3>
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {sprint.issue_count} issues
            </span>
          </div>

          {sprint.goal && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {sprint.goal}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            {dateRange}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {sprint.status === 'planning' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStart}
                disabled={startSprint.isPending}
                className="gap-1"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteSprint.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {sprint.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={completeSprint.isPending}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
          )}
          {sprint.status === 'completed' && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Issues List (Expanded) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {issues.length > 0 ? (
            <>
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} projectId={projectId} />
              ))}
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No issues in this sprint</p>
              {sprint.status !== 'completed' && onAddIssues && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddIssues}
                  className="mt-2"
                >
                  + Add Issues
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
