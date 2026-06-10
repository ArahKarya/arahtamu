import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/error-boundary';
import { DepartmentPage } from './pages/DepartmentPage';
import { LocationPage } from './pages/LocationPage';
import { HostPage } from './pages/HostPage';
import { VisitorPage } from './pages/VisitorPage';
import { VisitPage } from './pages/VisitPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PreregistrationPage } from './pages/PreregistrationPage';
import { ConsentPage } from './pages/ConsentPage';
import { ReportsPage } from './pages/ReportsPage';
import { KioskPage } from './pages/KioskPage';

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit-logs" element={<AuditLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
                    <Route path="departments" element={<DepartmentPage />} />
                    <Route path="locations" element={<LocationPage />} />
                    <Route path="hosts" element={<HostPage />} />
                    <Route path="visitors" element={<VisitorPage />} />
                    <Route path="visits" element={<VisitPage />} />
                    <Route path="watchlists" element={<WatchlistPage />} />
                    <Route path="preregistrations" element={<PreregistrationPage />} />
                    <Route path="consents" element={<ConsentPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="kiosk" element={<KioskPage />} />
          {/* ROUTES_GENERATOR_MARKER */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
