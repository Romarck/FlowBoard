// Project-related TypeScript types

import type { UserRole, User } from './auth';

export type ProjectMethodology = 'kanban' | 'scrum';

export type StatusCategory = 'todo' | 'in_progress' | 'done';

export interface WorkflowStatus {
  id: string;
  name: string;
  category: StatusCategory;
  position: number;
  wip_limit: number | null;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  methodology: ProjectMethodology;
  owner_id: string;
  issue_counter: number;
  member_count: number;
  created_at: string;
  updated_at: string;
  workflow_statuses: WorkflowStatus[];
}

export interface ProjectListItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
  methodology: ProjectMethodology;
  member_count: number;
  created_at: string;
}

export interface CreateProjectData {
  name: string;
  key?: string;
  description?: string;
  methodology: ProjectMethodology;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  methodology?: ProjectMethodology;
}

export interface PaginatedProjects {
  items: ProjectListItem[];
  total: number;
  page: number;
  size: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  user: User;
  role: UserRole;
  joined_at: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}
