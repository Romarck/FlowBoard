import type { IssuePriority } from '@/types/issue';

interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
}

const priorityStyles: Record<IssuePriority, { bg: string; text: string; label: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Critical',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Medium',
  },
  low: {
    bg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Low',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const style = priorityStyles[priority];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${className || ''}`}>
      {style.label}
    </span>
  );
}
