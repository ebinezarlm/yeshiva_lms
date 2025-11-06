import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';

export default function RoleRedirect() {
  const { user } = useAuth();

  // For development, bypass authentication if bypass_auth is set
  if (import.meta.env.MODE === 'development') {
    const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
    if (bypassAuth) {
      // Default to admin dashboard for demo purposes
      return <Redirect to="/admin/dashboard" />;
    }
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Redirect to="/admin/dashboard" />;
    case 'tutor':
      return <Redirect to="/tutor/dashboard" />;
    case 'student':
      return <Redirect to="/student/dashboard" />;
    default:
      return <Redirect to="/login" />;
  }
}