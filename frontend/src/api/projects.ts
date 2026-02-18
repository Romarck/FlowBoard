import client from './client';
import type { Project, ProjectListItem, CreateProjectData, UpdateProjectData, PaginatedProjects, ProjectMember, AddMemberData, UpdateMemberData } from '../types/project';

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

  // Member management
  listMembers: (projectId: string) =>
    client.get<ProjectMember[]>(`/api/v1/projects/${projectId}/members`).then(r => r.data),

  addMember: (projectId: string, data: AddMemberData) =>
    client.post<ProjectMember>(`/api/v1/projects/${projectId}/members`, data).then(r => r.data),

  updateMember: (projectId: string, userId: string, data: UpdateMemberData) =>
    client.patch<ProjectMember>(`/api/v1/projects/${projectId}/members/${userId}`, data).then(r => r.data),

  removeMember: (projectId: string, userId: string) =>
    client.delete(`/api/v1/projects/${projectId}/members/${userId}`),
};
