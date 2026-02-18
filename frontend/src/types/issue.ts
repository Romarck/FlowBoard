// Issue-related TypeScript types

import type { User } from './auth';
import type { Label, WorkflowStatus } from './project';

export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'subtask';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export type RelationType = 'blocks' | 'is_blocked_by' | 'relates_to';

export interface Issue {
  id: string;
  project_id: string;
  type: IssueType;
  key: string;
  title: string;
  description: string | null;
  status_id: string;
  status: WorkflowStatus;
  priority: IssuePriority;
  assignee_id: string | null;
  assignee: User | null;
  reporter_id: string;
  reporter: User;
  sprint_id: string | null;
  parent_id: string | null;
  story_points: number | null;
  due_date: string | null;
  position: number;
  labels: Label[];
  created_at: string;
  updated_at: string;
}

export interface IssueRelation {
  id: string;
  source_issue_id: string;
  target_issue_id: string;
  relation_type: RelationType;
  created_at: string;
}

export interface IssueHistory {
  id: string;
  issue_id: string;
  user_id: string;
  user: User;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface CreateIssueRequest {
  type: IssueType;
  title: string;
  description?: string;
  priority?: IssuePriority;
  assignee_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  due_date?: string;
  label_ids?: string[];
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  assignee_id?: string | null;
  sprint_id?: string | null;
  status_id?: string;
  story_points?: number | null;
  due_date?: string | null;
}

export interface MoveIssueRequest {
  status_id: string;
  position: number;
}
