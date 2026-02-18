import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useProjectMetrics } from '../../hooks/useMetrics';
import {
  MetricCard,
  IssueDistribution,
  SprintProgressCard,
  TeamWorkload,
} from '../../components/dashboard';
import { ISSUE_TYPE_LABELS, ISSUE_PRIORITY_LABELS } from '../../lib/constants';

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: metrics, isLoading, isError, error } = useProjectMetrics(projectId!);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-gray-400">Project not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 p-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-200">
            {error instanceof Error ? error.message : 'Failed to load dashboard metrics'}
          </p>
        </div>
      </div>
    );
  }

  // Prepare distribution data
  const priorityItems = metrics.by_priority.map((item) => ({
    label: ISSUE_PRIORITY_LABELS[item.priority as keyof typeof ISSUE_PRIORITY_LABELS] || item.priority,
    count: item.count,
    color:
      item.priority === 'critical'
        ? '#dc2626'
        : item.priority === 'high'
          ? '#f97316'
          : item.priority === 'medium'
            ? '#eab308'
            : '#60a5fa',
  }));

  const typeItems = metrics.by_type.map((item) => ({
    label: ISSUE_TYPE_LABELS[item.type as keyof typeof ISSUE_TYPE_LABELS] || item.type,
    count: item.count,
    color:
      item.type === 'epic'
        ? '#a855f7'
        : item.type === 'story'
          ? '#3b82f6'
          : item.type === 'task'
            ? '#10b981'
            : item.type === 'bug'
              ? '#ef4444'
              : '#9ca3af',
  }));

  const statusItems = metrics.by_status.map((item) => ({
    label: item.status_name,
    count: item.count,
    color:
      item.category === 'todo'
        ? '#6b7280'
        : item.category === 'in_progress'
          ? '#0ea5e9'
          : item.category === 'done'
            ? '#10b981'
            : '#9ca3af',
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Project metrics and overview
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Issues"
          value={metrics.total_issues}
          subtitle={`${metrics.open_issues} open`}
          variant="default"
        />
        <MetricCard
          title="Open Issues"
          value={metrics.open_issues}
          subtitle={`${((metrics.open_issues / metrics.total_issues) * 100).toFixed(0)}% of total`}
          variant="warning"
        />
        <MetricCard
          title="Completed"
          value={metrics.completed_issues}
          subtitle={`${((metrics.completed_issues / metrics.total_issues) * 100).toFixed(0)}% done`}
          variant="success"
        />
        <MetricCard
          title="Overdue"
          value={metrics.overdue_issues}
          subtitle="Need attention"
          variant={metrics.overdue_issues > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Sprint and Distributions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Sprint */}
        <div className="lg:col-span-1">
          {metrics.active_sprint ? (
            <SprintProgressCard sprint={metrics.active_sprint} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-600 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No active sprint
              </p>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="lg:col-span-1">
          <IssueDistribution
            title="By Priority"
            items={priorityItems}
            total={metrics.total_issues}
          />
        </div>

        {/* Type Distribution */}
        <div className="lg:col-span-1">
          <IssueDistribution
            title="By Type"
            items={typeItems}
            total={metrics.total_issues}
          />
        </div>
      </div>

      {/* Status and Team */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <IssueDistribution
          title="By Status"
          items={statusItems}
          total={metrics.total_issues}
        />

        {/* Team Workload */}
        <TeamWorkload members={metrics.issues_by_member} />
      </div>

      {/* Recent Sprints */}
      {metrics.recent_sprints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sprints
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.recent_sprints.map((sprint) => (
              <SprintProgressCard key={sprint.id} sprint={sprint} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
