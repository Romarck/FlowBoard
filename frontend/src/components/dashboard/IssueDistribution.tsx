import { Card } from '../ui/card';

interface DistributionItem {
  label: string;
  count: number;
  color: string;
}

interface IssueDistributionProps {
  title: string;
  items: DistributionItem[];
  total: number;
}

export function IssueDistribution({
  title,
  items,
  total,
}: IssueDistributionProps) {
  if (total === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {item.count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
