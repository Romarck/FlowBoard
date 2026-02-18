import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attachmentApi } from '@/api/attachments'
import type { Attachment } from '@/types/attachment'

const attachmentKeys = {
  all: ['attachments'] as const,
  byIssue: (projectId: string, issueId: string) => [...attachmentKeys.all, projectId, issueId] as const,
}

export function useAttachments(projectId: string, issueId: string) {
  return useQuery({
    queryKey: attachmentKeys.byIssue(projectId, issueId),
    queryFn: () => attachmentApi.list(projectId, issueId),
    enabled: !!projectId && !!issueId,
  })
}

export function useUploadAttachment(projectId: string, issueId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => attachmentApi.upload(projectId, issueId, file),
    onSuccess: (newAttachment) => {
      // Update the attachments list in cache
      queryClient.setQueryData(
        attachmentKeys.byIssue(projectId, issueId),
        (old: Attachment[] | undefined) => {
          if (!old) return [newAttachment]
          return [newAttachment, ...old]
        }
      )
    },
  })
}

export function useDeleteAttachment(projectId: string, issueId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attachmentId: string) => attachmentApi.delete(projectId, issueId, attachmentId),
    onSuccess: (_, attachmentId) => {
      // Remove from cache
      queryClient.setQueryData(
        attachmentKeys.byIssue(projectId, issueId),
        (old: Attachment[] | undefined) => {
          if (!old) return []
          return old.filter(a => a.id !== attachmentId)
        }
      )
    },
  })
}
