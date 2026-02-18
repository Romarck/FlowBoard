import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { BoardPage } from '@/pages/board/BoardPage';
import { BacklogPage } from '@/pages/backlog/BacklogPage';
import { SprintPage } from '@/pages/sprints/SprintPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectSettingsPage } from '@/pages/projects/ProjectSettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes (wrapped in AppLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route
            path="/projects/:projectId/board"
            element={<BoardPage />}
          />
          <Route
            path="/projects/:projectId/backlog"
            element={<BacklogPage />}
          />
          <Route
            path="/projects/:projectId/sprints"
            element={<SprintPage />}
          />
          <Route
            path="/projects/:projectId/dashboard"
            element={<DashboardPage />}
          />
          <Route
            path="/projects/:projectId/settings"
            element={<ProjectSettingsPage />}
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
