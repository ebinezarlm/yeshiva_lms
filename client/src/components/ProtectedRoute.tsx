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

  // For development, bypass authentication if bypass_auth is set
  if (import.meta.env.MODE === 'development') {
    const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
    if (bypassAuth) {
      return <>{children}</>;
    }
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Allow admin users to access all routes
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If the route requires a role that the user doesn't have, redirect to their dashboard
    const userDashboard = `/${user.role}/dashboard`;
    return <Redirect to={userDashboard} />;
  }

  return <>{children}</>;
}