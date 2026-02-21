import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateIssue, useIssues } from '@/hooks/useIssues';
import type { CreateIssueRequest, IssueType } from '@/types/issue';
import type { ProjectMember } from '@/types/project';

interface CreateIssueDialogProps {
  projectId: string;
  projectMembers: ProjectMember[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateIssueDialog({ projectId, projectMembers, isOpen, onOpenChange, onSuccess }: CreateIssueDialogProps) {
  const [formData, setFormData] = useState<CreateIssueRequest>({
    type: 'task',
    title: '',
    priority: 'medium',
  });
  const [error, setError] = useState('');

  const createMutation = useCreateIssue(projectId);
  const { data: issuesData, isLoading: issuesLoading } = useIssues(projectId, { size: 500 });

  const parentConfig = useMemo<{ required: boolean; label: string; filterType: IssueType } | null>(() => {
    switch (formData.type) {
      case 'story':
        return { required: true, label: 'Parent Epic', filterType: 'epic' };
      case 'task':
      case 'bug':
        return { required: false, label: 'Parent Story', filterType: 'story' };
      case 'subtask':
        return { required: true, label: 'Parent Task', filterType: 'task' };
      default:
        return null;
    }
  }, [formData.type]);

  const parentCandidates = useMemo(() => {
    if (!parentConfig || !issuesData?.items) return [];
    return issuesData.items.filter(i => i.type === parentConfig.filterType);
  }, [issuesData?.items, parentConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createMutation.mutateAsync(formData);
      setFormData({
        type: 'task',
        title: '',
        priority: 'medium',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError('');
  };

  const isLoading = createMutation.isPending;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Issue</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Type */}
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CreateIssueRequest['type'], parent_id: undefined }))}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Epic</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="subtask">Subtask</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parent Issue */}
          {parentConfig && !issuesLoading && (
            <div>
              <Label htmlFor="parent">
                {parentConfig.label}
                {parentConfig.required ? ' *' : ''}
              </Label>
              <Select
                value={formData.parent_id || '__none__'}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    parent_id: value === '__none__' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger id="parent" className="w-full">
                  <SelectValue placeholder={`Select parent ${parentConfig.filterType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {!parentConfig.required && (
                    <SelectItem value="__none__">None</SelectItem>
                  )}
                  {parentCandidates.map(issue => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.key} — {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              minLength={2}
              maxLength={255}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Issue title"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the issue..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as CreateIssueRequest['priority'] }))}>
              <SelectTrigger id="priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={formData.assignee_id || '__none__'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignee_id: value === '__none__' ? undefined : value }))}
            >
              <SelectTrigger id="assignee" className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {projectMembers.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Story Points */}
          <div>
            <Label htmlFor="story-points">Story Points</Label>
            <Input
              id="story-points"
              type="number"
              min="0"
              max="999"
              value={formData.story_points || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, story_points: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="0"
              disabled={isLoading}
            />
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value || undefined }))}
              disabled={isLoading}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || (!!parentConfig?.required && !formData.parent_id)} className="flex-1 gap-2">
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
