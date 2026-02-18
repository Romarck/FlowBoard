import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/api/search';
import type { FilterState, SavedFilter } from '@/types/filter';

export const searchKeys = {
  all: ['search'] as const,
  byProject: (projectId: string) => [...searchKeys.all, projectId] as const,
  search: (projectId: string, filters: FilterState) =>
    [...searchKeys.byProject(projectId), 'search', filters] as const,
  saved: (projectId: string) => [...searchKeys.byProject(projectId), 'saved'] as const,
};

export function useSearch(projectId: string, filters: FilterState) {
  // Only execute if there are active filters
  const hasFilters = Object.values(filters).some((v) => v !== '');

  return useQuery({
    queryKey: searchKeys.search(projectId, filters),
    queryFn: () => searchApi.search(projectId, filters),
    enabled: hasFilters && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSavedFilters(projectId: string) {
  return useQuery({
    queryKey: searchKeys.saved(projectId),
    queryFn: () => searchApi.getSavedFilters(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSavedFilter(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; filters: FilterState }) =>
      searchApi.createSavedFilter(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: searchKeys.saved(projectId) });
    },
  });
}

export function useDeleteSavedFilter(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (filterId: string) => searchApi.deleteSavedFilter(projectId, filterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: searchKeys.saved(projectId) });
    },
  });
}
