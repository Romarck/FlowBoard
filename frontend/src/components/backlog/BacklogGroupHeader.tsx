import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import type { IssueListItem } from '@/api/issues';
import type { IssueType } from '@/types/issue';

interface BacklogGroupHeaderProps {
  epic: IssueListItem | null;
  count: number;
  children: ReactNode;
}

export function BacklogGroupHeader({ epic, count, children }: BacklogGroupHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <div
        onClick={toggleCollapse}
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 rotate-[-90deg]" />
        {epic ? (
          <>
            <IssueTypeIcon type={epic.type as IssueType} className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400 flex-shrink-0">{epic.key}</span>
            <span className="text-sm text-gray-900 dark:text-white font-medium">{epic.title}</span>
          </>
        ) : (
          <span className="text-sm text-gray-900 dark:text-white font-medium">No Epic</span>
        )}
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-900 rounded">
          {count} issue{count !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={toggleCollapse}
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform" />
        {epic ? (
          <>
            <IssueTypeIcon type={epic.type as IssueType} className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400 flex-shrink-0">{epic.key}</span>
            <span className="text-sm text-gray-900 dark:text-white font-medium">{epic.title}</span>
          </>
        ) : (
          <span className="text-sm text-gray-900 dark:text-white font-medium">No Epic</span>
        )}
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-900 rounded">
          {count} issue{count !== 1 ? 's' : ''}
        </span>
      </div>
      <div>{children}</div>
    </>
  );
}
