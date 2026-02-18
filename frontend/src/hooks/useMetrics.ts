import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import type { ProjectMetrics } from '../types/metrics';

export function useProjectMetrics(projectId: string) {
  return useQuery<ProjectMetrics>({
    queryKey: ['metrics', projectId],
    queryFn: () => projectsApi.getMetrics(projectId),
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
    enabled: !!projectId,
  });
}
