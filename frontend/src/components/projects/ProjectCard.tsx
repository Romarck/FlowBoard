import { useNavigate } from 'react-router-dom';
import { MoreVertical, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProjectListItem } from '@/types/project';

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/projects/${project.id}/board`);
  };

  const methodologyColor = project.methodology === 'scrum' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {project.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {project.description || 'No description'}
            </p>
          </div>
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const menu = e.currentTarget.nextElementSibling;
              if (menu) {
                menu.classList.toggle('hidden');
              }
            }}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          <div className="hidden absolute right-4 top-12 z-10 w-32 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 text-left"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              Edit
            </button>
            <button
              className="block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 text-left"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${methodologyColor}`}>
            {project.methodology === 'scrum' ? 'Scrum' : 'Kanban'}
          </span>
          <span className="inline-block px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 rounded dark:bg-gray-800 dark:text-gray-200">
            {project.key}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
          </div>
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
