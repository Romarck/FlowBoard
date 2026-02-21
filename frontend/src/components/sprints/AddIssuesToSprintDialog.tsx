import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Search, Loader2 } from 'lucide-react';
import { useIssues } from '@/hooks/useIssues';
import { useAssignIssueSprint } from '@/hooks/useIssues';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import { PriorityBadge } from '@/components/issues/PriorityBadge';
import type { IssueType, IssuePriority } from '@/types/issue';

interface AddIssuesToSprintDialogProps {
  projectId: string;
  sprintId: string;
  sprintName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Allowed issue types for sprint assignment (no epics or subtasks). */
const SPRINT_ASSIGNABLE_TYPES: ReadonlySet<string> = new Set(['story', 'task', 'bug']);

export function AddIssuesToSprintDialog({
  projectId,
  sprintId,
  sprintName,
  open,
  onOpenChange,
}: AddIssuesToSprintDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: issuesData, isLoading } = useIssues(projectId);
  const assignSprint = useAssignIssueSprint(projectId);

  // Filter backlog issues: no sprint, correct types
  const backlogIssues = useMemo(() => {
    const items = issuesData?.items ?? [];
    return items.filter((issue) => {
      // Only issues without a sprint
      if (issue.sprint_id != null) return false;
      // Only story, task, bug
      if (!SPRINT_ASSIGNABLE_TYPES.has(issue.type)) return false;
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          issue.key.toLowerCase().includes(term) ||
          issue.title.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [issuesData, searchTerm]);

  const toggleSelection = (issueId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === backlogIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(backlogIssues.map((i) => i.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const promises = Array.from(selectedIds).map((issueId) =>
        assignSprint.mutateAsync({ issueId, sprintId })
      );
      await Promise.all(promises);

      // Reset and close
      setSelectedIds(new Set());
      setSearchTerm('');
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add issues to sprint.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedIds(new Set());
      setSearchTerm('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Issues to {sprintName}</DialogTitle>
          <DialogDescription>
            Select backlog issues to add to this sprint. Only Stories, Tasks, and Bugs
            without a sprint assignment are shown.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by key or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-gray-200 dark:divide-gray-700 min-h-[200px] max-h-[400px]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && backlogIssues.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'No matching issues found.'
                  : 'No backlog issues available to add.'}
              </p>
            </div>
          )}

          {!isLoading && backlogIssues.length > 0 && (
            <>
              {/* Select All header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === backlogIssues.length && backlogIssues.length > 0}
                  onChange={toggleAll}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} of ${backlogIssues.length} selected`
                    : `${backlogIssues.length} issues available`}
                </span>
              </div>

              {backlogIssues.map((issue) => (
                <label
                  key={issue.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedIds.has(issue.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  } ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(issue.id)}
                    onChange={() => toggleSelection(issue.id)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <IssueTypeIcon type={issue.type as IssueType} className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {issue.key}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                    {issue.title}
                  </span>
                  <PriorityBadge priority={issue.priority as IssuePriority} />
                </label>
              ))}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              `Add ${selectedIds.size > 0 ? selectedIds.size : ''} to Sprint`.trim()
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
