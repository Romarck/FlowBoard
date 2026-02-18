export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, string | undefined>;
  created_at: string;
}

export interface FilterState {
  search: string;
  type: string;
  priority: string;
  status_id: string;
  assignee_id: string;
  label_id: string;
  sprint_id: string;
}
