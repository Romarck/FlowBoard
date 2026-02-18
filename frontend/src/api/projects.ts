import client from './client';
import type { Project, ProjectListItem, CreateProjectData, UpdateProjectData, PaginatedProjects } from '../types/project';

export const projectsApi = {
  create: (data: CreateProjectData) =>
    client.post<Project>('/api/v1/projects', data).then(r => r.data),

  list: (page = 1, size = 20) =>
    client.get<PaginatedProjects>('/api/v1/projects', { params: { page, size } }).then(r => r.data),

  get: (id: string) =>
    client.get<Project>(`/api/v1/projects/${id}`).then(r => r.data),

  update: (id: string, data: UpdateProjectData) =>
    client.patch<Project>(`/api/v1/projects/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/api/v1/projects/${id}`),
};
