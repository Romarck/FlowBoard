import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import type { CreateProjectData, UpdateProjectData, AddMemberData, UpdateMemberData } from '../types/project';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, id] as const,
};

export function useProjects(page = 1, size = 20) {
  return useQuery({
    queryKey: [...projectKeys.lists(), page, size],
    queryFn: () => projectsApi.list(page, size),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), 'members'],
    queryFn: () => projectsApi.listMembers(projectId),
    enabled: !!projectId,
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberData) => projectsApi.addMember(projectId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), 'members'] }),
  });
}

export function useUpdateMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateMemberData }) =>
      projectsApi.updateMember(projectId, userId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), 'members'] }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), 'members'] }),
  });
}
