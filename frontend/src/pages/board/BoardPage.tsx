import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/components/board';
import { IssueDetailDrawer } from '@/components/issues/IssueDetailDrawer';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { useProject, useStatuses, useMembers } from '@/hooks/useProjects';
import { useIssues, useMoveIssue } from '@/hooks/useIssues';
import type { Issue, IssueType, IssuePriority } from '@/types/issue';
import type { IssueListItem } from '@/api/issues';

export function BoardPage() {
  const { projectId = '' } = useParams();
  const { data: project } = useProject(projectId);
  const { data: statuses } = useStatuses(projectId);
  const { data: members } = useMembers(projectId);
  const { data: issueList } = useIssues(projectId, { size: 200 });
  const moveIssueMutation = useMoveIssue(projectId);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);

  // Local state for optimistic updates
  const [optimisticIssues, setOptimisticIssues] = useState<IssueListItem[]>([]);

  // Group issues by status, using optimistic state if available
  const issuesByStatus = useMemo(() => {
    const map: Record<string, IssueListItem[]> = {};
    if (statuses) {
      statuses.forEach((s) => {
        map[s.id] = [];
      });
    }

    const issuesToUse = optimisticIssues.length > 0 ? optimisticIssues : issueList?.items || [];
    issuesToUse.forEach((issue) => {
      if (map[issue.status_id]) {
        map[issue.status_id].push(issue);
      }
    });

    return map;
  }, [issueList, statuses, optimisticIssues]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Could update UI here to show drop preview
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const draggedIssueId = active.id as string;
    const targetStatusId = over.id as string;

    // Find the dragged issue
    const draggedIssue = (optimisticIssues.length > 0 ? optimisticIssues : issueList?.items || []).find(
      (i) => i.id === draggedIssueId
    );
    if (!draggedIssue) return;

    // If dropped on the same column and same position, do nothing
    if (draggedIssue.status_id === targetStatusId) {
      return;
    }

    // Calculate new position (append to end of target column)
    const targetColumnIssues = issuesByStatus[targetStatusId] || [];
    const newPosition = targetColumnIssues.length;

    // Optimistic update
    const newIssueList = (optimisticIssues.length > 0 ? optimisticIssues : issueList?.items || []).map((i) =>
      i.id === draggedIssueId
        ? { ...i, status_id: targetStatusId, position: newPosition }
        : i
    );
    setOptimisticIssues(newIssueList);

    // Call API
    moveIssueMutation.mutate(
      {
        issueId: draggedIssueId,
        data: {
          status_id: targetStatusId,
          position: newPosition,
        },
      },
      {
        onError: () => {
          // Revert optimistic update on error
          setOptimisticIssues([]);
        },
        onSuccess: () => {
          // Clear optimistic state on success
          setOptimisticIssues([]);
        },
      }
    );
  };

  const handleIssueClick = (issue: IssueListItem) => {
    setSelectedIssue({
      ...issue,
      type: issue.type as IssueType,
      priority: issue.priority as IssuePriority,
      status: statuses?.find((s) => s.id === issue.status_id) || {
        id: issue.status_id,
        name: '',
        category: 'todo',
        position: 0,
        wip_limit: null,
      },
      assignee: members?.find((m) => m.user_id === issue.assignee_id)
        ? {
            id: issue.assignee_id || '',
            name: members?.find((m) => m.user_id === issue.assignee_id)?.name || '',
            email: members?.find((m) => m.user_id === issue.assignee_id)?.email || '',
            avatar_url: members?.find((m) => m.user_id === issue.assignee_id)?.avatar_url || null,
          }
        : null,
      reporter: {
        id: '',
        name: '',
        email: '',
        avatar_url: null,
      },
      status_id: issue.status_id,
      project_id: projectId,
      key: issue.key,
      title: issue.title,
      description: null,
      assignee_id: issue.assignee_id,
      reporter_id: '',
      sprint_id: null,
      parent_id: null,
      story_points: issue.story_points,
      due_date: null,
      position: issue.position,
      labels: [],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    });
    setDrawerOpen(true);
  };

  if (!statuses) {
    return <div className="text-center py-8">Loading board...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project?.name || 'Board'}
            </h1>
          </div>
          <Button type="button" className="gap-2" onClick={() => setCreateIssueOpen(true)}>
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>

        {/* Filters Bar (placeholder) */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Filters: Type • Priority • Assignee</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4">
            {statuses.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                issues={issuesByStatus[status.id] || []}
                onIssueClick={handleIssueClick}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        projectId={projectId}
        projectMembers={members || []}
        isOpen={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
      />

      {/* Issue Detail Drawer */}
      {drawerOpen && (
        <IssueDetailDrawer
          issue={selectedIssue}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          projectId={projectId}
          projectMembers={members || []}
          statuses={statuses}
        />
      )}
    </div>
  );
}
