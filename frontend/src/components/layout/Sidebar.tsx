import { useParams, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  List,
  Zap,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

const NAV_ICONS = {
  board: LayoutDashboard,
  backlog: List,
  sprints: Zap,
  dashboard: BarChart3,
  settings: Settings,
} as const;

const NAV_ITEMS = [
  { label: 'Board', path: 'board', icon: 'board' as const },
  { label: 'Backlog', path: 'backlog', icon: 'backlog' as const },
  { label: 'Sprints', path: 'sprints', icon: 'sprints' as const },
  { label: 'Dashboard', path: 'dashboard', icon: 'dashboard' as const },
  { label: 'Settings', path: 'settings', icon: 'settings' as const },
];

export function Sidebar() {
  const { projectId } = useParams();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-700 dark:bg-gray-900',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        {sidebarOpen && (
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            FlowBoard
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronsLeft className="h-5 w-5" />
          ) : (
            <ChevronsRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Project selector placeholder */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md bg-gray-100 p-2 dark:bg-gray-800',
            !sidebarOpen && 'justify-center'
          )}
        >
          <FolderKanban className="h-5 w-5 shrink-0 text-blue-600" />
          {sidebarOpen && (
            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
              {projectId ? `Project ${projectId.slice(0, 8)}` : 'Select Project'}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {projectId &&
          NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <NavLink
                key={item.path}
                to={`/projects/${projectId}/${item.path}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                    !sidebarOpen && 'justify-center px-2'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        {!projectId && (
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                !sidebarOpen && 'justify-center px-2'
              )
            }
          >
            <FolderKanban className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>All Projects</span>}
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
