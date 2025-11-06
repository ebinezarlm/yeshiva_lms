import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiClient, { setTokens, getAccessToken as getToken } from '@/lib/axios';
import axios from 'axios';

export type UserRole = 'superadmin' | 'admin' | 'tutor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('lms_access_token');
    const storedRefreshToken = localStorage.getItem('lms_refresh_token');

    // For development, bypass authentication and use a mock user
    if (import.meta.env.MODE === 'development') {
      // Check if we want to bypass auth (e.g., for demo purposes)
      const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
      if (bypassAuth) {
        setUser({
          id: 'mock-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin', // Default to admin role for demo
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }
    }

    if (storedAccessToken && storedRefreshToken) {
      setTokens(storedAccessToken, storedRefreshToken);
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [loadUserProfile]);

  const login = async (email: string, password: string) => {
    // For development, bypass actual login and use a mock user
    if (import.meta.env.MODE === 'development') {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock user based on email
      let role: UserRole = 'student';
      if (email.includes('admin')) role = 'admin';
      if (email.includes('superadmin')) role = 'superadmin';
      if (email.includes('tutor')) role = 'tutor';
      
      const mockUser: User = {
        id: 'mock-user-id',
        name: email.split('@')[0],
        email,
        role,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      
      // Set mock tokens
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      
      setTokens(mockAccessToken, mockRefreshToken);
      localStorage.setItem('lms_access_token', mockAccessToken);
      localStorage.setItem('lms_refresh_token', mockRefreshToken);
      
      setUser(mockUser);
      setIsLoading(false);
      return;
    }
    
    // Production login flow
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      setTokens(newAccessToken, newRefreshToken);
      localStorage.setItem('lms_access_token', newAccessToken);
      localStorage.setItem('lms_refresh_token', newRefreshToken);

      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = getToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setTokens(null, null);
      localStorage.removeItem('lms_access_token');
      localStorage.removeItem('lms_refresh_token');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}