import { Switch, Route, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

import LoginPage from '@/pages/LoginPage';
import RoleRedirect from '@/pages/RoleRedirect';
import NotFound from '@/pages/not-found';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import TutorDashboardPage from '@/pages/tutor/TutorDashboardPage';
import StudentDashboardPage from '@/pages/student/StudentDashboardPage';

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

        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/users">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">User Management</h2>
              <p className="text-muted-foreground">User management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/playlists">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Playlist Management</h2>
              <p className="text-muted-foreground">Playlist management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/payments">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Payments</h2>
              <p className="text-muted-foreground">Payment management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/invoices">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Invoices</h2>
              <p className="text-muted-foreground">Invoice management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/analytics">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Analytics</h2>
              <p className="text-muted-foreground">Analytics dashboard coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/admin/settings">
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Settings</h2>
              <p className="text-muted-foreground">Settings panel coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/dashboard">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/playlists">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/upload">
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/comments">
          <ProtectedRoute allowedRoles={['tutor']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Comments & Q&A</h2>
              <p className="text-muted-foreground">Comments management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/earnings">
          <ProtectedRoute allowedRoles={['tutor']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Earnings</h2>
              <p className="text-muted-foreground">Earnings dashboard coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/tutor/profile">
          <ProtectedRoute allowedRoles={['tutor']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Profile</h2>
              <p className="text-muted-foreground">Profile settings coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/student/dashboard">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/student/playlists">
          <ProtectedRoute allowedRoles={['student']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">My Playlists</h2>
              <p className="text-muted-foreground">Your enrolled playlists will appear here</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/student/explore">
          <ProtectedRoute allowedRoles={['student']}>
            <StudentVideoFeed />
          </ProtectedRoute>
        </Route>

        <Route path="/student/subscriptions">
          <ProtectedRoute allowedRoles={['student']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">My Subscriptions</h2>
              <p className="text-muted-foreground">Subscription management interface coming soon</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/student/qna">
          <ProtectedRoute allowedRoles={['student']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Q&A</h2>
              <p className="text-muted-foreground">Your questions and answers will appear here</p>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/student/profile">
          <ProtectedRoute allowedRoles={['student']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Profile</h2>
              <p className="text-muted-foreground">Profile settings coming soon</p>
            </div>
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
          <Router />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
