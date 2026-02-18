import client from './client'
import type { Attachment } from '../types/attachment'

export const attachmentApi = {
  list: (projectId: string, issueId: string) =>
    client.get<Attachment[]>(`/api/v1/projects/${projectId}/issues/${issueId}/attachments`).then(r => r.data),

  upload: (projectId: string, issueId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<Attachment>(
      `/api/v1/projects/${projectId}/issues/${issueId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data)
  },

  delete: (projectId: string, issueId: string, attachmentId: string) =>
    client.delete(`/api/v1/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}`).then(r => r.data),
}
