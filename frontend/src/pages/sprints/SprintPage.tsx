import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CreateSprintDialog, SprintCard } from '@/components/sprints';
import { AddIssuesToSprintDialog } from '@/components/sprints/AddIssuesToSprintDialog';
import { useSprints } from '@/hooks/useSprints';
import { useIssues } from '@/hooks/useIssues';
import { AlertCircle, Zap } from 'lucide-react';

interface AddIssuesTarget {
  sprintId: string;
  sprintName: string;
}

export function SprintPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [addIssuesTarget, setAddIssuesTarget] = useState<AddIssuesTarget | null>(null);

  // Hooks must be called unconditionally (rules-of-hooks)
  const { data: sprints = [], isLoading: sprintsLoading, error: sprintsError } = useSprints(projectId ?? '');
  const { data: issuesData, isLoading: issuesLoading } = useIssues(projectId ?? '');
  const allIssues = issuesData?.items ?? [];

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Project ID not found</p>
      </div>
    );
  }

  // Organize sprints by status
  const activeSprint = sprints.find((s) => s.status === 'active');
  const planningSprints = sprints.filter((s) => s.status === 'planning');
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  // Group issues by sprint
  const issuesBySprint = (sprintId: string) =>
    allIssues.filter((i) => i.sprint_id === sprintId);

  const isLoading = sprintsLoading || issuesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sprints</h1>
        <CreateSprintDialog projectId={projectId} />
      </div>

      {/* Error State */}
      {sprintsError && (
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load sprints. Please try again.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && sprints.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
          <Zap className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No sprints yet
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your first sprint to get started with sprint planning.
          </p>
        </div>
      )}

      {!isLoading && sprints.length > 0 && (
        <div className="space-y-8">
          {/* Active Sprint */}
          {activeSprint && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Sprint
              </h2>
              <SprintCard
                projectId={projectId}
                sprint={activeSprint}
                issues={issuesBySprint(activeSprint.id)}
                isActive
                onAddIssues={() =>
                  setAddIssuesTarget({
                    sprintId: activeSprint.id,
                    sprintName: activeSprint.name,
                  })
                }
              />
            </section>
          )}

          {/* Planning Sprints */}
          {planningSprints.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Planning ({planningSprints.length})
              </h2>
              <div className="space-y-3">
                {planningSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    projectId={projectId}
                    sprint={sprint}
                    issues={issuesBySprint(sprint.id)}
                    onAddIssues={() =>
                      setAddIssuesTarget({
                        sprintId: sprint.id,
                        sprintName: sprint.name,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Sprints */}
          {completedSprints.length > 0 && (
            <section>
              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Completed ({completedSprints.length})
                </summary>
                <div className="space-y-3 mt-4">
                  {completedSprints.map((sprint) => (
                    <SprintCard
                      key={sprint.id}
                      projectId={projectId}
                      sprint={sprint}
                      issues={issuesBySprint(sprint.id)}
                    />
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      )}

      {/* Add Issues to Sprint Dialog */}
      {addIssuesTarget && (
        <AddIssuesToSprintDialog
          projectId={projectId}
          sprintId={addIssuesTarget.sprintId}
          sprintName={addIssuesTarget.sprintName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setAddIssuesTarget(null);
          }}
        />
      )}
    </div>
  );
}
