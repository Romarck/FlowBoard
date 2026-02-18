import { useState } from 'react';
import { FolderKanban, Plus, Loader } from 'lucide-react';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import type { ProjectListItem } from '@/types/project';

export function ProjectListPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useProjects(page, pageSize);
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const projects = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Client-side filtering by name or key
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (project: ProjectListItem) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await deleteProject.mutateAsync(project.id);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const handleEdit = (project: ProjectListItem) => {
    // TODO: Navigate to edit page when available
    console.log('Edit project:', project);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Projects
        </h1>
        <button
          onClick={() => setShowDialog(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Search bar */}
      <div>
        <input
          type="text"
          placeholder="Search by name or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredProjects.length === 0 && total === 0 ? (
        // Empty state
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-900">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No projects yet
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your first project to get started.
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        // No search results
        <div className="rounded-lg border border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            No projects match "{searchQuery}"
          </p>
        </div>
      ) : (
        <>
          {/* Grid of projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create project dialog */}
      <CreateProjectDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => {
          setPage(1);
          setSearchQuery('');
        }}
      />
    </div>
  );
}
