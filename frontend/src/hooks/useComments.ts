import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@/api/comments';
import type { Comment, CreateCommentData } from '@/types/comment';

const createCommentKeys = {
  all: ['comments'] as const,
  byIssue: (projectId: string, issueId: string) =>
    [...createCommentKeys.all, projectId, issueId] as const,
};

export function useComments(projectId: string, issueId: string) {
  return useQuery({
    queryKey: createCommentKeys.byIssue(projectId, issueId),
    queryFn: () => commentApi.list(projectId, issueId),
    enabled: !!projectId && !!issueId,
  });
}

export function useCreateComment(projectId: string, issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) =>
      commentApi.create(projectId, issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: createCommentKeys.byIssue(projectId, issueId),
      });
    },
  });
}

export function useUpdateComment(projectId: string, issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentApi.update(projectId, issueId, commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: createCommentKeys.byIssue(projectId, issueId),
      });
    },
  });
}

export function useDeleteComment(projectId: string, issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      commentApi.delete(projectId, issueId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: createCommentKeys.byIssue(projectId, issueId),
      });
    },
  });
}
