import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import type { UserRole } from '@/context/AuthContext';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === 'superadmin'
          ? '/superadmin/dashboard'
          : user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'tutor'
          ? '/tutor/dashboard'
          : '/student/dashboard';
      setLocation(redirectPath);
    }
  }, [isAuthenticated, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully!',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid credentials. Please try again.';
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickRole: UserRole) => {
    const emails: Record<UserRole, string> = {
      superadmin: 'superadmin@lms.com',
      admin: 'admin@lms.com',
      tutor: 'tutor@lms.com',
      student: 'student@lms.com',
    };
    setEmail(emails[quickRole]);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-login-title">
            Welcome to LMS
          </CardTitle>
          <CardDescription data-testid="text-login-description">
            Sign in to access your learning dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || authLoading}
              data-testid="button-login"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Quick Demo Login
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('student')}
                data-testid="button-quick-student"
              >
                Student
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('tutor')}
                data-testid="button-quick-tutor"
              >
                Tutor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('admin')}
                data-testid="button-quick-admin"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('superadmin')}
                data-testid="button-quick-superadmin"
              >
                Super Admin
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            All demo accounts use password: <strong>password123</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
