// Metrics-related TypeScript types

export interface IssuesByStatus {
  status_name: string;
  category: string; // 'todo' | 'in_progress' | 'done'
  count: number;
}

export interface IssuesByPriority {
  priority: string;
  count: number;
}

export interface IssuesByType {
  type: string;
  count: number;
}

export interface SprintMetrics {
  id: string;
  name: string;
  planned_points: number;
  completed_points: number;
  issue_count: number;
  completed_count: number;
}

export interface IssueMemberStats {
  member_id: string;
  name: string;
  avatar_url: string | null;
  open_count: number;
}

export interface ProjectMetrics {
  // Overview
  total_issues: number;
  open_issues: number;
  completed_issues: number;
  overdue_issues: number;

  // Breakdowns
  by_status: IssuesByStatus[];
  by_priority: IssuesByPriority[];
  by_type: IssuesByType[];

  // Sprint data
  active_sprint: SprintMetrics | null;
  recent_sprints: SprintMetrics[];

  // Team
  issues_by_member: IssueMemberStats[];
}
