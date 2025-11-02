import { Switch, Route, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

import LoginPage from '@/pages/LoginPage';
import RoleRedirect from '@/pages/RoleRedirect';
import NotFound from '@/pages/not-found';

import SuperAdminDashboardPage from '@/pages/superadmin/SuperAdminDashboardPage';
import SuperAdminAccessControlPage from '@/pages/superadmin/SuperAdminAccessControlPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminPlaylistsPage from '@/pages/admin/AdminPlaylistsPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import TutorDashboardPage from '@/pages/tutor/TutorDashboardPage';
import TutorPlaylistsPage from '@/pages/tutor/TutorPlaylistsPage';
import TutorUploadVideosPage from '@/pages/tutor/TutorUploadVideosPage';
import TutorCommentsPage from '@/pages/tutor/TutorCommentsPage';
import TutorEarningsPage from '@/pages/tutor/TutorEarningsPage';
import TutorProfilePage from '@/pages/tutor/TutorProfilePage';

import StudentDashboardPage from '@/pages/student/StudentDashboardPage';
import StudentPlaylistsPage from '@/pages/student/StudentPlaylistsPage';
import StudentPlaylistDetailPage from '@/pages/student/StudentPlaylistDetailPage';
import StudentExploreCoursesPage from '@/pages/student/StudentExploreCoursesPage';
import StudentSubscriptionsPage from '@/pages/student/StudentSubscriptionsPage';
import StudentQnaPage from '@/pages/student/StudentQnaPage';
import StudentProfilePage from '@/pages/student/StudentProfilePage';

import TutorDashboard from '@/pages/TutorDashboard';
import StudentVideoFeed from '@/pages/StudentVideoFeed';

function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isLoginPage = location === '/login';

  if (isLoginPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        
        <Route path="/">
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        </Route>

        <Route path="/superadmin/dashboard">
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/superadmin/access-control">
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminAccessControlPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/users">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/playlists">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPlaylistsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/payments">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPaymentsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/settings">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettingsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/dashboard">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/playlists">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorPlaylistsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/upload">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorUploadVideosPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/comments">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorCommentsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/earnings">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorEarningsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/profile">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorProfilePage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/dashboard">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/playlists">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentPlaylistsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/playlist/:id">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentPlaylistDetailPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/explore">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExploreCoursesPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/subscriptions">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSubscriptionsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/qna">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentQnaPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/profile">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfilePage />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PermissionsProvider>
            <Router />
          </PermissionsProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
