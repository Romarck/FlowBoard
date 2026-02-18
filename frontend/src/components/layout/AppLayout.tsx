import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  // Responsive: collapse sidebar on small screens
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div
        className={cn(
          'shrink-0 transition-all duration-200',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        <Sidebar />
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
