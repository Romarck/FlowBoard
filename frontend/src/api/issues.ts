import client from './client';
import type { Issue, CreateIssueRequest, UpdateIssueRequest, MoveIssueRequest } from '../types/issue';

export interface IssueListItem {
  id: string;
  project_id: string;
  type: string;
  key: string;
  title: string;
  status_id: string;
  priority: string;
  assignee_id: string | null;
  parent_id: string | null;
  story_points: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IssueListResponse {
  items: IssueListItem[];
  total: number;
  page: number;
  size: number;
}

export interface IssueFilters {
  type?: string;
  status_id?: string;
  priority?: string;
  assignee_id?: string;
  sprint_id?: string;
  page?: number;
  size?: number;
}

export const issueApi = {
  list: (projectId: string, filters?: IssueFilters) =>
    client.get<IssueListResponse>(`/api/v1/projects/${projectId}/issues`, { params: filters }).then(r => r.data),

  get: (projectId: string, issueId: string) =>
    client.get<Issue>(`/api/v1/projects/${projectId}/issues/${issueId}`).then(r => r.data),

  create: (projectId: string, data: CreateIssueRequest) =>
    client.post<Issue>(`/api/v1/projects/${projectId}/issues`, data).then(r => r.data),

  update: (projectId: string, issueId: string, data: UpdateIssueRequest) =>
    client.patch<Issue>(`/api/v1/projects/${projectId}/issues/${issueId}`, data).then(r => r.data),

  delete: (projectId: string, issueId: string) =>
    client.delete(`/api/v1/projects/${projectId}/issues/${issueId}`),

  move: (projectId: string, issueId: string, data: MoveIssueRequest) =>
    client.post(`/api/v1/projects/${projectId}/issues/${issueId}/move`, data).then(r => r.data),
};
