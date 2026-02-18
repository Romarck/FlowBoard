import client from './client';
import type { Sprint, CreateSprintRequest, UpdateSprintRequest, SprintIssueMove } from '@/types/sprint';

export const sprintApi = {
  /**
   * GET /api/v1/projects/{projectId}/sprints - Get all sprints, optionally filtered by status
   */
  list: async (projectId: string, status?: string): Promise<Sprint[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const url = `/api/v1/projects/${projectId}/sprints?${params.toString()}`;
    const response = await client.get<Sprint[]>(url);
    return response.data;
  },

  /**
   * GET /api/v1/projects/{projectId}/sprints/{sprintId} - Get a specific sprint
   */
  get: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await client.get<Sprint>(
      `/api/v1/projects/${projectId}/sprints/${sprintId}`
    );
    return response.data;
  },

  /**
   * POST /api/v1/projects/{projectId}/sprints - Create a new sprint
   */
  create: async (projectId: string, data: CreateSprintRequest): Promise<Sprint> => {
    const response = await client.post<Sprint>(
      `/api/v1/projects/${projectId}/sprints`,
      data
    );
    return response.data;
  },

  /**
   * PATCH /api/v1/projects/{projectId}/sprints/{sprintId} - Update sprint details
   */
  update: async (projectId: string, sprintId: string, data: UpdateSprintRequest): Promise<Sprint> => {
    const response = await client.patch<Sprint>(
      `/api/v1/projects/${projectId}/sprints/${sprintId}`,
      data
    );
    return response.data;
  },

  /**
   * POST /api/v1/projects/{projectId}/sprints/{sprintId}/start - Start a planning sprint
   */
  start: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await client.post<Sprint>(
      `/api/v1/projects/${projectId}/sprints/${sprintId}/start`
    );
    return response.data;
  },

  /**
   * POST /api/v1/projects/{projectId}/sprints/{sprintId}/complete - Complete an active sprint
   */
  complete: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await client.post<Sprint>(
      `/api/v1/projects/${projectId}/sprints/${sprintId}/complete`
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/projects/{projectId}/sprints/{sprintId} - Delete a planning sprint
   */
  delete: async (projectId: string, sprintId: string): Promise<void> => {
    await client.delete(`/api/v1/projects/${projectId}/sprints/${sprintId}`);
  },

  /**
   * POST /api/v1/projects/{projectId}/sprints/{sprintId}/issues - Add issues to sprint
   */
  addIssues: async (projectId: string, sprintId: string, issueIds: string[]): Promise<{ count: number }> => {
    const response = await client.post<{ count: number }>(
      `/api/v1/projects/${projectId}/sprints/${sprintId}/issues`,
      { issue_ids: issueIds }
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/projects/{projectId}/sprints/{sprintId}/issues/{issueId} - Remove issue from sprint
   */
  removeIssue: async (projectId: string, sprintId: string, issueId: string): Promise<void> => {
    await client.delete(
      `/api/v1/projects/${projectId}/sprints/${sprintId}/issues/${issueId}`
    );
  },
};
