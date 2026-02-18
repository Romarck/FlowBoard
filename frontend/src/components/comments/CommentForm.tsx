import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useCreateComment } from '@/hooks/useComments';
import type { User } from '@/types/auth';

interface CommentFormProps {
  projectId: string;
  issueId: string;
  currentUser: User;
}

export function CommentForm({
  projectId,
  issueId,
  currentUser,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const createMutation = useCreateComment(projectId, issueId);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createMutation.mutateAsync({
        content: content.trim(),
      });
      setContent('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
        <UserAvatar
          name={currentUser.name}
          avatarUrl={currentUser.avatar_url}
          size="sm"
        />
        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-24 resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
