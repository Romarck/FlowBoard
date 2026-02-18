import { useState } from 'react';
import { Search, X, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSavedFilters, useCreateSavedFilter, useDeleteSavedFilter } from '@/hooks/useSearch';
import { useProjects } from '@/hooks/useProjects';
import type { FilterState, SavedFilter } from '@/types/filter';
import type { ProjectMember } from '@/types/project';

interface AdvancedFiltersProps {
  projectId: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  members: ProjectMember[];
}

export function AdvancedFilters({ projectId, filters, onFiltersChange, members }: AdvancedFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const { data: savedFilters = [] } = useSavedFilters(projectId);
  const createFilter = useCreateSavedFilter(projectId);
  const deleteFilter = useDeleteSavedFilter(projectId);

  const hasFilters = Object.values(filters).some((v) => v !== '');

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      type: '',
      priority: '',
      status_id: '',
      assignee_id: '',
      label_id: '',
      sprint_id: '',
    });
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;

    await createFilter.mutateAsync({
      name: filterName,
      filters,
    });

    setFilterName('');
    setShowSaveDialog(false);
  };

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters as FilterState);
  };

  const handleDeleteSavedFilter = (filterId: string) => {
    deleteFilter.mutate(filterId);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Filter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <Select value={filters.type} onValueChange={(type) => onFiltersChange({ ...filters, type })}>
          <SelectTrigger>
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
        <Select value={filters.priority} onValueChange={(priority) => onFiltersChange({ ...filters, priority })}>
          <SelectTrigger>
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
        <Select value={filters.assignee_id} onValueChange={(id) => onFiltersChange({ ...filters, assignee_id: id })}>
          <SelectTrigger>
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save as Filter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Filter</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Filter name (e.g., High Priority Stories)"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="mt-2"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFilter} disabled={!filterName.trim() || createFilter.isPending}>
                  {createFilter.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Saved Filters</h3>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              >
                <button
                  onClick={() => handleLoadSavedFilter(filter)}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                >
                  {filter.name}
                </button>
                <button
                  onClick={() => handleDeleteSavedFilter(filter.id)}
                  className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  disabled={deleteFilter.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
