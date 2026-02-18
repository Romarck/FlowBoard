import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { IssueTypeIcon } from './IssueTypeIcon';
import { useUpdateIssue } from '@/hooks/useIssues';
import type { Issue } from '@/types/issue';
import type { WorkflowStatus, ProjectMember } from '@/types/project';

interface IssueDetailDrawerProps {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectMembers: ProjectMember[];
  statuses: WorkflowStatus[];
}

export function IssueDetailDrawer({
  issue,
  open,
  onClose,
  projectId,
  projectMembers,
  statuses,
}: IssueDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const updateMutation = useUpdateIssue(projectId, issue?.id || '');

  // Sync local state with issue
  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
    }
  }, [issue]);

  if (!open || !issue) return null;

  // Debounced update
  const handleFieldUpdate = async (field: string, value: unknown) => {
    try {
      const updateData: Record<string, unknown> = {};
      updateData[field] = value;
      await updateMutation.mutateAsync(updateData);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleTitleBlur = async () => {
    if (title !== issue.title) {
      await handleFieldUpdate('title', title);
    }
  };

  const handleDescriptionBlur = async () => {
    if (description !== issue.description) {
      await handleFieldUpdate('description', description);
    }
  };

  const reporterInfo = issue.reporter
    ? { name: issue.reporter.name, avatar_url: issue.reporter.avatar_url }
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IssueTypeIcon type={issue.type} className="h-5 w-5" />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{issue.key}</span>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {editingField === 'title' ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <button
                    onClick={() => setEditingField('title')}
                    className="text-left hover:text-gray-900 dark:hover:text-white transition-colors max-w-xs truncate"
                  >
                    {issue.title}
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[65px] z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Description</Label>
                <div className="mt-2">
                  {editingField === 'description' ? (
                    <Textarea
                      autoFocus
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescriptionBlur}
                      rows={5}
                      className="w-full"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('description')}
                      className="w-full text-left p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {description ? (
                        <p className="text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap">{description}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm italic">No description yet. Click to add.</p>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={issue.status_id}
                    onValueChange={(value) => handleFieldUpdate('status_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Priority
                  </Label>
                  <Select
                    value={issue.priority}
                    onValueChange={(value) => handleFieldUpdate('priority', value)}
                  >
                    <SelectTrigger className="w-full">
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
                  <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Assignee
                  </Label>
                  <Select
                    value={issue.assignee_id || ''}
                    onValueChange={(value) => handleFieldUpdate('assignee_id', value || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {projectMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reporter */}
                <div>
                  <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Reporter
                  </Label>
                  {reporterInfo && (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={reporterInfo.name} avatarUrl={reporterInfo.avatar_url} size="sm" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{reporterInfo.name}</span>
                    </div>
                  )}
                </div>

                {/* Story Points */}
                <div>
                  <Label htmlFor="story-points" className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Story Points
                  </Label>
                  <Input
                    id="story-points"
                    type="number"
                    min="0"
                    max="999"
                    value={issue.story_points || ''}
                    onChange={(e) => handleFieldUpdate('story_points', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <Label htmlFor="due-date" className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={issue.due_date ? issue.due_date.split('T')[0] : ''}
                    onChange={(e) => handleFieldUpdate('due_date', e.target.value || null)}
                  />
                </div>
              </div>

              {/* Children/Subtasks */}
              {issue.id && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-3 block">
                      Subtasks
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No subtasks yet</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Activity log coming soon</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
