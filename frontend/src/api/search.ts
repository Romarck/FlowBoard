import client from './client';
import type { IssueListResponse } from './issues';
import type { SavedFilter, FilterState } from '@/types/filter';

export const searchApi = {
  search: (projectId: string, filters: FilterState, page = 1, size = 50) => {
    const params = {
      q: filters.search || undefined,
      type: filters.type || undefined,
      priority: filters.priority || undefined,
      status_id: filters.status_id || undefined,
      assignee_id: filters.assignee_id || undefined,
      label_id: filters.label_id || undefined,
      sprint_id: filters.sprint_id || undefined,
      page,
      size,
    };

    // Remove undefined values
    Object.keys(params).forEach(
      (key) => params[key as keyof typeof params] === undefined && delete params[key as keyof typeof params]
    );

    return client
      .get<IssueListResponse>(`/api/v1/projects/${projectId}/search`, { params })
      .then((r) => r.data);
  },

  getSavedFilters: (projectId: string) =>
    client
      .get<SavedFilter[]>(`/api/v1/projects/${projectId}/filters/saved`)
      .then((r) => r.data),

  createSavedFilter: (projectId: string, data: { name: string; filters: FilterState }) =>
    client
      .post<SavedFilter>(`/api/v1/projects/${projectId}/filters/saved`, data)
      .then((r) => r.data),

  deleteSavedFilter: (projectId: string, filterId: string) =>
    client.delete(`/api/v1/projects/${projectId}/filters/saved/${filterId}`),
};
