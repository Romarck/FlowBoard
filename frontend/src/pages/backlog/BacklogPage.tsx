import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BacklogFilters, BacklogGroupHeader } from '@/components/backlog';
import { IssueRow } from '@/components/issues/IssueRow';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { IssueDetailDrawer } from '@/components/issues/IssueDetailDrawer';
import { useProject, useMembers, useStatuses } from '@/hooks/useProjects';
import { useIssues, useIssue } from '@/hooks/useIssues';
import type { BacklogFilterState } from '@/components/backlog/BacklogFilters';
import type { IssueListItem } from '@/api/issues';

export function BacklogPage() {
  const { projectId } = useParams();
  const [filters, setFilters] = useState<BacklogFilterState>({
    search: '',
    type: '',
    priority: '',
    assigneeId: '',
  });
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogTrigger, setCreateDialogTrigger] = useState(false);

  // Call all hooks unconditionally
  const { data: project, isLoading: projectLoading } = useProject(projectId || '');
  const { data: members, isLoading: membersLoading } = useMembers(projectId || '');
  const { data: statuses, isLoading: statusesLoading } = useStatuses(projectId || '');
  const { data: selectedIssue } = useIssue(projectId || '', selectedIssueId || '');
  const { data: issueList, isLoading: issuesLoading } = useIssues(projectId || '', {
    type: filters.type || undefined,
    priority: filters.priority || undefined,
    assignee_id: filters.assigneeId || undefined,
    size: 200,
  });

  // Filter by search term locally
  const filteredIssues = useMemo(() => {
    if (!issueList?.items) return [];
    if (!filters.search) return issueList.items;
    const q = filters.search.toLowerCase();
    return issueList.items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    );
  }, [issueList, filters.search]);

  // Group issues by epic
  const groupedIssues = useMemo(() => {
    if (!filteredIssues) return [];

    const epics = filteredIssues.filter((i) => i.type === 'epic');
    const nonEpics = filteredIssues.filter((i) => i.type !== 'epic');

    const groups: { epic: IssueListItem | null; issues: IssueListItem[] }[] = [
      // Epics with their child issues
      ...epics.map((epic) => ({
        epic,
        issues: nonEpics.filter((i) => i.parent_id === epic.id),
      })),
      // Issues without a parent epic
      {
        epic: null,
        issues: nonEpics.filter(
          (i) => !i.parent_id || !epics.find((e) => e.id === i.parent_id)
        ),
      },
    ];

    // Filter out empty groups (except "No Epic" which should always be shown if there are issues without epic)
    return groups.filter((g) => g.issues.length > 0 || (g.epic !== null && g.epic !== undefined));
  }, [filteredIssues]);

  // Handle issue selection and open drawer
  const handleIssueClick = (issue: IssueListItem) => {
    setSelectedIssueId(issue.id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedIssueId(null);
  };

  const handleCreateSuccess = () => {
    setCreateDialogTrigger(false);
  };

  // Guard against missing projectId
  if (!projectId) {
    return <div>Project not found</div>;
  }

  const isLoading = projectLoading || membersLoading || statusesLoading || issuesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Map status and assignee for IssueRow
  const getStatusForIssue = (statusId: string) => {
    return statuses?.find((s) => s.id === statusId);
  };

  const getAssigneeForIssue = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const member = members?.find((m) => m.user_id === assigneeId);
    if (!member) return null;
    return {
      id: member.user_id,
      name: member.name,
      email: member.email,
      avatar_url: member.avatar_url,
      role: member.role,
      created_at: new Date().toISOString(),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Backlog
          </h1>
          {project && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {project.name} · {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          onClick={() => setCreateDialogTrigger(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filters */}
      {members && members.length > 0 && (
        <BacklogFilters
          filters={filters}
          onFiltersChange={setFilters}
          members={members}
        />
      )}

      {/* Issues List or Empty State */}
      {filteredIssues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {filters.search || filters.type || filters.priority || filters.assigneeId
              ? 'No issues match your filters'
              : 'No issues yet'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {filters.search || filters.type || filters.priority || filters.assigneeId
              ? 'Try adjusting your filters'
              : 'Create your first issue to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          {groupedIssues.map((group) => (
            <BacklogGroupHeader
              key={group.epic?.id || 'no-epic'}
              epic={group.epic || null}
              count={group.issues.length}
            >
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {group.issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    status={getStatusForIssue(issue.status_id)}
                    assignee={getAssigneeForIssue(issue.assignee_id)}
                    onClick={() => handleIssueClick(issue)}
                  />
                ))}
              </div>
            </BacklogGroupHeader>
          ))}
        </div>
      )}

      {/* Create Issue Dialog */}
      {createDialogTrigger && members && (
        <CreateIssueDialog
          projectId={projectId}
          projectMembers={members}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Issue Detail Drawer */}
      {statuses && members && (
        <IssueDetailDrawer
          issue={selectedIssue || null}
          open={drawerOpen}
          onClose={handleDrawerClose}
          projectId={projectId}
          projectMembers={members}
          statuses={statuses}
        />
      )}
    </div>
  );
}
