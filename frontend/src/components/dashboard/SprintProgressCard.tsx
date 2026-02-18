import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { SprintMetrics } from '../../types/metrics';

interface SprintProgressCardProps {
  sprint: SprintMetrics;
}

export function SprintProgressCard({ sprint }: SprintProgressCardProps) {
  const pointsPercentage = sprint.planned_points > 0
    ? ((sprint.completed_points / sprint.planned_points) * 100).toFixed(0)
    : 0;

  const issuesPercentage = sprint.issue_count > 0
    ? ((sprint.completed_count / sprint.issue_count) * 100).toFixed(0)
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Sprint: {sprint.name}
        </h3>
        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          Active
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Story Points Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Story Points
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {sprint.completed_points}/{sprint.planned_points}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${pointsPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {pointsPercentage}% complete
          </p>
        </div>

        {/* Issues Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Issues
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {sprint.completed_count}/{sprint.issue_count}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${issuesPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {issuesPercentage}% done
          </p>
        </div>
      </div>
    </Card>
  );
}
