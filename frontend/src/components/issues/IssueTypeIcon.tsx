import { Zap, BookOpen, CheckSquare, Bug, Layers } from 'lucide-react';
import type { IssueType } from '@/types/issue';

interface IssueTypeIconProps {
  type: IssueType;
  className?: string;
}

export function IssueTypeIcon({ type, className = 'h-5 w-5' }: IssueTypeIconProps) {
  const iconProps = { className, strokeWidth: 2 };

  switch (type) {
    case 'epic':
      return <Zap {...iconProps} className={`${className} text-purple-600 dark:text-purple-400`} />;
    case 'story':
      return <BookOpen {...iconProps} className={`${className} text-blue-600 dark:text-blue-400`} />;
    case 'task':
      return <CheckSquare {...iconProps} className={`${className} text-green-600 dark:text-green-400`} />;
    case 'bug':
      return <Bug {...iconProps} className={`${className} text-red-600 dark:text-red-400`} />;
    case 'subtask':
      return <Layers {...iconProps} className={`${className} text-gray-600 dark:text-gray-400`} />;
    default:
      return <CheckSquare {...iconProps} className={`${className} text-gray-600 dark:text-gray-400`} />;
  }
}
