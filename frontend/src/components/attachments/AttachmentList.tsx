import { useRef, useState } from 'react'
import { FileImage, FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/useAttachments'
import type { Attachment } from '@/types/attachment'

interface AttachmentListProps {
  projectId: string
  issueId: string
  currentUserId: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getFileIcon(mimeType: string, fileName: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-4 w-4 text-blue-500" />
  }
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-500" />
  }
  return <FileText className="h-4 w-4 text-gray-500" />
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function AttachmentList({ projectId, issueId, currentUserId }: AttachmentListProps) {
  const { data: attachments = [], isLoading } = useAttachments(projectId, issueId)
  const uploadMutation = useUploadAttachment(projectId, issueId)
  const deleteMutation = useDeleteAttachment(projectId, issueId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`)
      return
    }

    try {
      await uploadMutation.mutateAsync(file)
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete ${attachment.filename}?`)) return
    try {
      await deleteMutation.mutateAsync(attachment.id)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
          Attachments
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="text-xs h-8"
        >
          <Upload className="h-3 w-3 mr-1" />
          {uploadMutation.isPending ? 'Uploading...' : 'Add File'}
        </Button>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          {uploadError}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">No attachments yet</div>
      ) : (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              {/* Icon/Preview */}
              <div className="flex-shrink-0">
                {isImageFile(attachment.mime_type) ? (
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                    {getFileIcon(attachment.mime_type, attachment.filename)}
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {attachment.filename}
                </a>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(attachment.size)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <UserAvatar
                      name={attachment.uploader.name}
                      avatarUrl={attachment.uploader.avatar_url}
                      size="sm"
                    />
                    <span>{attachment.uploader.name}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Delete button */}
              {currentUserId === attachment.uploader.id && (
                <button
                  onClick={() => handleDelete(attachment)}
                  disabled={deleteMutation.isPending}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Delete attachment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
