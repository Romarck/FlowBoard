import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProject, useUpdateProject, useMembers, useUpdateMember, useRemoveMember } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { AddMemberDialog } from '@/components/projects/AddMemberDialog';
import type { ProjectMethodology, UpdateMemberData } from '@/types/project';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  project_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  developer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatJoinedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [editingMethodology, setEditingMethodology] = useState<ProjectMethodology | null>(null);

  if (!projectId) {
    return <div>Project not found</div>;
  }

  const project = useProject(projectId);
  const members = useMembers(projectId);
  const updateProject = useUpdateProject();
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);

  const currentProject = project.data;
  const currentMembers = members.data || [];

  // Determine current user's role from members list
  const currentUserRole = useMemo(() => {
    if (!user) return 'viewer';
    const userMember = currentMembers.find((m) => m.user_id === user.id);
    return (userMember?.role as 'admin' | 'project_manager' | 'developer' | 'viewer') || 'viewer';
  }, [currentMembers, user]);

  const handleSaveName = async () => {
    if (!editingName || !currentProject) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { name: editingName },
      });
      setEditingName(null);
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  };

  const handleSaveDescription = async () => {
    if (editingDescription === null || !currentProject) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { description: editingDescription || undefined },
      });
      setEditingDescription(null);
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  const handleSaveMethodology = async () => {
    if (!editingMethodology || !currentProject) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { methodology: editingMethodology },
      });
      setEditingMethodology(null);
    } catch (error) {
      console.error('Failed to update methodology:', error);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: UpdateMemberData['role']) => {
    try {
      await updateMember.mutateAsync({ userId, data: { role: newRole } });
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember.mutateAsync(userId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  if (project.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!currentProject) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage project details, members, and workflows
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General</h2>

        <div className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label>Project Name</Label>
            {editingName === null ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">{currentProject.name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingName(currentProject.name)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  disabled={updateProject.isPending}
                />
                <Button
                  onClick={handleSaveName}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingName(null)}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {editingDescription === null ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {currentProject.description || 'No description'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDescription(currentProject.description || '')}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  placeholder="Add a description..."
                  disabled={updateProject.isPending}
                />
                <Button
                  onClick={handleSaveDescription}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingDescription(null)}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Methodology */}
          <div className="space-y-2">
            <Label>Methodology</Label>
            {editingMethodology === null ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {currentProject.methodology}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMethodology(currentProject.methodology as ProjectMethodology)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={editingMethodology}
                  onValueChange={(v) => setEditingMethodology(v as ProjectMethodology)}
                  disabled={updateProject.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">Kanban</SelectItem>
                    <SelectItem value="scrum">Scrum</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSaveMethodology}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingMethodology(null)}
                  disabled={updateProject.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
          <Button
            onClick={() => setShowAddMember(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {members.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : currentMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No team members yet. Add your first team member to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Joined {formatJoinedDate(member.joined_at)}
                    </div>
                  </div>

                  {member.user_id === currentProject.owner_id ? (
                    <Badge className={ROLE_COLORS['admin']} variant="secondary">
                      Owner
                    </Badge>
                  ) : currentUserRole === 'admin' ? (
                    <div className="w-40">
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          handleUpdateMemberRole(member.user_id, v as UpdateMemberData['role'])
                        }
                        disabled={updateMember.isPending}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="project_manager">Project Manager</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Badge
                      className={ROLE_COLORS[member.role] || ROLE_COLORS['developer']}
                      variant="secondary"
                    >
                      {member.role.replace('_', ' ')}
                    </Badge>
                  )}

                  {currentUserRole === 'admin' && member.user_id !== currentProject.owner_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      disabled={removeMember.isPending}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Future Tabs */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Additional Settings
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/50">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Workflow Statuses</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Customize your project workflow</p>
            </div>
            <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700">
              Coming Soon
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/50">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Labels</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Manage project labels</p>
            </div>
            <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700">
              Coming Soon
            </Badge>
          </div>
        </div>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        projectId={projectId}
      />
    </div>
  );
}
