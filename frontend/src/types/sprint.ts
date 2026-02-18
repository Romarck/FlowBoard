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
  created_at: string;
  updated_at: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

export interface CompleteSprintRequest {
  move_incomplete_to: string | 'backlog';
}

export interface BurndownDataPoint {
  date: string;
  remaining: number;
  ideal: number;
}
