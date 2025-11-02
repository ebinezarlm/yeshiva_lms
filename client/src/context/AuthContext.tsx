import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'tutor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('lms_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('lms_user');
      }
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    // TODO: Replace with actual API call
    // const response = await axios.post('/api/auth/login', { email, password, role });
    // const userData = response.data;
    
    // Mock login - simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: `${role}-${Date.now()}`,
      name: role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin User' : role === 'tutor' ? 'Tutor User' : 'Student User',
      email,
      role,
    };

    setUser(mockUser);
    localStorage.setItem('lms_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    // TODO: Replace with actual API call
    // await axios.post('/api/auth/logout');
    
    setUser(null);
    localStorage.removeItem('lms_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
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
