import { useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useUpdateComment, useDeleteComment } from '@/hooks/useComments';
import { formatRelativeTime } from '@/utils/date';
import type { Comment } from '@/types/comment';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  projectId: string;
  issueId: string;
}

export function CommentItem({
  comment,
  currentUserId,
  projectId,
  issueId,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const updateMutation = useUpdateComment(projectId, issueId);
  const deleteMutation = useDeleteComment(projectId, issueId);

  const isAuthor = comment.author.id === currentUserId;

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    try {
      await updateMutation.mutateAsync({
        commentId: comment.id,
        content: editedContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteMutation.mutateAsync(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  return (
    <div className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={comment.author.name}
            avatarUrl={comment.author.avatar_url}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isAuthor && !isEditing && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-24 resize-none"
            placeholder="Edit comment..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(comment.content);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {comment.content}
        </p>
      )}
    </div>
  );
}
