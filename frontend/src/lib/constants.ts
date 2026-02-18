import type { IssuePriority, IssueType } from '@/types/issue';
import type { StatusCategory } from '@/types/project';

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  epic: 'Epic',
  story: 'Story',
  task: 'Task',
  bug: 'Bug',
  subtask: 'Subtask',
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  critical: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-400',
};

export const STATUS_CATEGORY_COLORS: Record<StatusCategory, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

export const NAV_ITEMS = [
  { label: 'Board', path: 'board', icon: 'LayoutDashboard' },
  { label: 'Backlog', path: 'backlog', icon: 'List' },
  { label: 'Sprints', path: 'sprints', icon: 'Zap' },
  { label: 'Dashboard', path: 'dashboard', icon: 'BarChart3' },
  { label: 'Settings', path: 'settings', icon: 'Settings' },
] as const;
