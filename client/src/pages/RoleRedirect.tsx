import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';

export default function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  switch (user.role) {
    case 'superadmin':
      return <Redirect to="/superadmin/dashboard" />;
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
