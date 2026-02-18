import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

// Placeholder flag: set to true to bypass auth during development
const DEV_BYPASS_AUTH = true;

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!DEV_BYPASS_AUTH && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
