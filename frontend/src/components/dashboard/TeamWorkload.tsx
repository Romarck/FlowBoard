import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { IssueMemberStats } from '../../types/metrics';

interface TeamWorkloadProps {
  members: IssueMemberStats[];
}

export function TeamWorkload({ members }: TeamWorkloadProps) {
  if (members.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Team Workload
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No assigned issues
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
        Team Workload
      </h3>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.member_id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar_url || ''} alt={member.name} />
                <AvatarFallback className="text-xs">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {member.name}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {member.open_count} open
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
