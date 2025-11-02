import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAccessToken = useCallback(() => accessToken, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post('/api/auth/refresh', {
        refreshToken,
      });

      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      accessToken = null;
      refreshToken = null;
      setUser(null);
      return null;
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      
      const newToken = await refreshAccessToken();
      if (newToken) {
        try {
          const retryResponse = await axios.get('/api/users/profile', {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          setUser(retryResponse.data);
        } catch (retryError) {
          accessToken = null;
          refreshToken = null;
          setUser(null);
        }
      } else {
        accessToken = null;
        refreshToken = null;
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('lms_access_token');
    const storedRefreshToken = localStorage.getItem('lms_refresh_token');

    if (storedAccessToken && storedRefreshToken) {
      accessToken = storedAccessToken;
      refreshToken = storedRefreshToken;
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [loadUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      accessToken = newAccessToken;
      refreshToken = newRefreshToken;

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
      if (accessToken) {
        await axios.post('/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      accessToken = null;
      refreshToken = null;
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
    getAccessToken,
    refreshAccessToken,
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
