import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from './AuthContext';

export interface RolePermissions {
  admin: string[];
  tutor: string[];
  student: string[];
}

interface PermissionsContextType {
  permissions: RolePermissions;
  updatePermissions: (role: keyof RolePermissions, features: string[]) => void;
  updateAllPermissions: (newPermissions: RolePermissions) => void;
  hasPermission: (role: UserRole, feature: string) => boolean;
}

const defaultPermissions: RolePermissions = {
  admin: ['Dashboard', 'Users', 'Playlists', 'Payments', 'Settings'],
  tutor: ['Dashboard', 'My Playlists', 'Upload Videos', 'Comments & Q&A', 'Earnings', 'Profile'],
  student: ['Dashboard', 'My Playlists', 'Explore', 'Subscriptions', 'Q&A', 'Profile'],
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<RolePermissions>(defaultPermissions);

  useEffect(() => {
    const storedPermissions = localStorage.getItem('lms_permissions');
    if (storedPermissions) {
      try {
        setPermissions(JSON.parse(storedPermissions));
      } catch (error) {
        console.error('Failed to parse stored permissions:', error);
      }
    }
  }, []);

  const updatePermissions = (role: keyof RolePermissions, features: string[]) => {
    const newPermissions = {
      ...permissions,
      [role]: features,
    };
    setPermissions(newPermissions);
    localStorage.setItem('lms_permissions', JSON.stringify(newPermissions));
  };

  const updateAllPermissions = (newPermissions: RolePermissions) => {
    setPermissions(newPermissions);
    localStorage.setItem('lms_permissions', JSON.stringify(newPermissions));
  };

  const hasPermission = (role: UserRole, feature: string): boolean => {
    if (role === 'superadmin') return true;
    return permissions[role as keyof RolePermissions]?.includes(feature) ?? false;
  };

  const value: PermissionsContextType = {
    permissions,
    updatePermissions,
    updateAllPermissions,
    hasPermission,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
