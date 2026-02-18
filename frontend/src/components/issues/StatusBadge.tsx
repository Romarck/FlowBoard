import type { WorkflowStatus } from '@/types/project';

interface StatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

const categoryStyles: Record<string, { bg: string; text: string }> = {
  todo: {
    bg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  done: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = categoryStyles[status.category] || categoryStyles.todo;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${className || ''}`}>
      {status.name}
    </span>
  );
}
