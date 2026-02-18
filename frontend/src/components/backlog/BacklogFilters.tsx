import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ProjectMember } from '@/types/project';

export interface BacklogFilterState {
  search: string;
  type: string;
  priority: string;
  assigneeId: string;
}

interface BacklogFiltersProps {
  filters: BacklogFilterState;
  onFiltersChange: (filters: BacklogFilterState) => void;
  members: ProjectMember[];
}

export function BacklogFilters({ filters, onFiltersChange, members }: BacklogFiltersProps) {
  const hasFilters = filters.search || filters.type || filters.priority || filters.assigneeId;

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type });
  };

  const handlePriorityChange = (priority: string) => {
    onFiltersChange({ ...filters, priority });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    onFiltersChange({ ...filters, assigneeId });
  };

  const handleClearFilters = () => {
    onFiltersChange({ search: '', type: '', priority: '', assigneeId: '' });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        <Input
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Type Filter */}
      <Select value={filters.type} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          <SelectItem value="epic">Epic</SelectItem>
          <SelectItem value="story">Story</SelectItem>
          <SelectItem value="task">Task</SelectItem>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="subtask">Subtask</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={filters.priority} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select value={filters.assigneeId} onValueChange={handleAssigneeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Assignees</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
