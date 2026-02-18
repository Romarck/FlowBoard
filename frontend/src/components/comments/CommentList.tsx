import { MessageCircle } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments } from '@/hooks/useComments';
import type { User } from '@/types/auth';

interface CommentListProps {
  projectId: string;
  issueId: string;
  currentUser: User;
}

export function CommentList({
  projectId,
  issueId,
  currentUser,
}: CommentListProps) {
  const { data: comments, isLoading, error } = useComments(projectId, issueId);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load comments</p>
      </div>
    );
  }

  return (
    <div>
      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Comments ({comments.length})
            </h3>
          </div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser.id}
              projectId={projectId}
              issueId={issueId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet</p>
        </div>
      )}

      {/* Comment Form */}
      <CommentForm
        projectId={projectId}
        issueId={issueId}
        currentUser={currentUser}
      />
    </div>
  );
}
