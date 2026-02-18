import api from './client';
import type { Comment, CreateCommentData } from '@/types/comment';

export const commentApi = {
  list: (projectId: string, issueId: string) =>
    api.get<Comment[]>(`/api/v1/projects/${projectId}/issues/${issueId}/comments`).then(r => r.data),

  create: (projectId: string, issueId: string, data: CreateCommentData) =>
    api.post<Comment>(`/api/v1/projects/${projectId}/issues/${issueId}/comments`, data).then(r => r.data),

  update: (projectId: string, issueId: string, commentId: string, data: { content: string }) =>
    api.patch<Comment>(`/api/v1/projects/${projectId}/issues/${issueId}/comments/${commentId}`, data).then(r => r.data),

  delete: (projectId: string, issueId: string, commentId: string) =>
    api.delete(`/api/v1/projects/${projectId}/issues/${issueId}/comments/${commentId}`),
};
