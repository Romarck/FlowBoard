import { Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProjectMember, UpdateMemberData } from '@/types/project';

interface MembersTableProps {
  members: ProjectMember[];
  ownerId: string;
  currentUserRole: 'admin' | 'project_manager' | 'developer' | 'viewer';
}

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

interface MemberRowProps {
  member: ProjectMember;
  isOwner: boolean;
  canManage: boolean;
  onRoleChange?: (userId: string, role: UpdateMemberData['role']) => void;
  onRemove?: (userId: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

function MemberRow({
  member,
  isOwner,
  canManage,
  onRoleChange,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: MemberRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 last:border-b-0 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
          <AvatarFallback className="text-xs font-semibold">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {member.name}
            </p>
            {isOwner && (
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500" title="Project Owner" />
            )}
          </div>
          <p className="truncate text-xs text-gray-600 dark:text-gray-400">
            {member.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Joined {formatJoinedDate(member.joined_at)}
        </div>

        {isOwner ? (
          <Badge className={ROLE_COLORS['admin']} variant="secondary">
            Owner
          </Badge>
        ) : canManage ? (
          <div className="w-40">
            <Select
              value={member.role}
              onValueChange={(value) => {
                if (onRoleChange) {
                  onRoleChange(member.user_id, value as UpdateMemberData['role']);
                }
              }}
              disabled={isUpdating}
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
          <Badge className={ROLE_COLORS[member.role] || ROLE_COLORS['developer']} variant="secondary">
            {member.role.replace('_', ' ')}
          </Badge>
        )}

        {canManage && !isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onRemove) {
                onRemove(member.user_id);
              }
            }}
            disabled={isRemoving}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
}

export function MembersTable({ members, ownerId, currentUserRole }: MembersTableProps) {
  const canManage = currentUserRole === 'admin';

  const sortedMembers = [...members].sort((a, b) => {
    // Owner first
    if (a.user_id === ownerId) return -1;
    if (b.user_id === ownerId) return 1;
    // Then by join date
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No team members yet
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {sortedMembers.map((member) => (
        <MemberRow
          key={member.user_id}
          member={member}
          isOwner={member.user_id === ownerId}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
