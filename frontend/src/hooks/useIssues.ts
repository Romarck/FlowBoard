import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueApi } from '@/api/issues';
import type { CreateIssueRequest, UpdateIssueRequest } from '@/types/issue';

export const issueKeys = {
  all: ['issues'] as const,
  byProject: (projectId: string) => [...issueKeys.all, projectId] as const,
  list: (projectId: string, filters?: Record<string, unknown>) =>
    [...issueKeys.byProject(projectId), 'list', filters] as const,
  detail: (projectId: string, issueId: string) =>
    [...issueKeys.byProject(projectId), issueId] as const,
};

export function useIssues(projectId: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: issueKeys.list(projectId, filters),
    queryFn: () => issueApi.list(projectId, filters),
    enabled: !!projectId,
  });
}

export function useIssue(projectId: string, issueId: string) {
  return useQuery({
    queryKey: issueKeys.detail(projectId, issueId),
    queryFn: () => issueApi.get(projectId, issueId),
    enabled: !!projectId && !!issueId,
  });
}

export function useCreateIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueRequest) => issueApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
    },
  });
}

export function useUpdateIssue(projectId: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIssueRequest) => issueApi.update(projectId, issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(projectId, issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => issueApi.delete(projectId, issueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
    },
  });
}

export function useMoveIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: { status_id: string; position: number } }) =>
      issueApi.move(projectId, issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.byProject(projectId) });
    },
  });
}
