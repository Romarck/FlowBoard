import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintApi } from '@/api/sprints';
import type { CreateSprintRequest, UpdateSprintRequest } from '@/types/sprint';

export const sprintKeys = {
  all: ['sprints'] as const,
  byProject: (projectId: string) => [...sprintKeys.all, projectId] as const,
  list: (projectId: string, status?: string) =>
    [...sprintKeys.byProject(projectId), 'list', status] as const,
  detail: (projectId: string, sprintId: string) =>
    [...sprintKeys.byProject(projectId), sprintId] as const,
};

/**
 * Fetch all sprints for a project, optionally filtered by status
 */
export function useSprints(projectId: string, status?: string) {
  return useQuery({
    queryKey: sprintKeys.list(projectId, status),
    queryFn: () => sprintApi.list(projectId, status),
    enabled: !!projectId,
  });
}

/**
 * Fetch a specific sprint by ID
 */
export function useSprint(projectId: string, sprintId: string) {
  return useQuery({
    queryKey: sprintKeys.detail(projectId, sprintId),
    queryFn: () => sprintApi.get(projectId, sprintId),
    enabled: !!projectId && !!sprintId,
  });
}

/**
 * Create a new sprint
 */
export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSprintRequest) => sprintApi.create(projectId, data),
    onSuccess: () => {
      // Invalidate all sprint queries for this project
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Update sprint details (name, goal, dates)
 */
export function useUpdateSprint(projectId: string, sprintId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSprintRequest) =>
      sprintApi.update(projectId, sprintId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.detail(projectId, sprintId) });
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Start a planning sprint (transition to active)
 */
export function useStartSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.start(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Complete an active sprint (transition to completed, move incomplete issues to backlog)
 */
export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.complete(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Delete a planning sprint
 */
export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.delete(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Add multiple issues to a sprint
 */
export function useAddIssuesToSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, issueIds }: { sprintId: string; issueIds: string[] }) =>
      sprintApi.addIssues(projectId, sprintId, issueIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/**
 * Remove an issue from a sprint (move to backlog)
 */
export function useRemoveIssueFromSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, issueId }: { sprintId: string; issueId: string }) =>
      sprintApi.removeIssue(projectId, sprintId, issueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}
