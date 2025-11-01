import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';
import { ReactNode } from 'react';
import type { UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to user's role-specific dashboard instead of /dashboard to avoid redirect loops
    const userDashboard = `/${user.role}/dashboard`;
    return <Redirect to={userDashboard} />;
  }

  return <>{children}</>;
}
