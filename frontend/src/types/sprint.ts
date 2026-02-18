// Sprint-related TypeScript types

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
  issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

export interface SprintIssueMove {
  issue_ids: string[];
}

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  ideal: number;
}
