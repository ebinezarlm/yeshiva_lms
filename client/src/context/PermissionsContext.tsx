import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the structure of permissions
interface Permissions {
  admin: string[];
  tutor: string[];
  student: string[];
}

// Default permissions for each role
const DEFAULT_PERMISSIONS: Permissions = {
  admin: [
    'Dashboard',
    'System Dashboard',
    'Access Control',
    'Users',
    'Playlists',
    'Payments',
    'Subscriptions',
    'Invoices',
    'Analytics',
    'Settings',
  ],
  tutor: [
    'Dashboard',
    'My Playlists',
    'Upload Videos',
    'Comments & Q&A',
    'Earnings',
    'Profile',
  ],
  student: [
    'Dashboard',
    'My Playlists',
    'Explore',
    'Subscriptions',
    'Q&A',
    'Profile',
  ],
};

interface PermissionsContextType {
  permissions: Permissions;
  hasPermission: (role: keyof Permissions, feature: string) => boolean;
  updateRolePermissions: (role: keyof Permissions, features: string[]) => void;
  updateAllPermissions: (newPermissions: Permissions) => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

  // Load permissions from localStorage on initial load
  useEffect(() => {
    const savedPermissions = localStorage.getItem('lms_permissions');
    if (savedPermissions) {
      try {
        setPermissions(JSON.parse(savedPermissions));
      } catch (error) {
        console.error('Failed to parse permissions from localStorage:', error);
      }
    }
  }, []);

  // Save permissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lms_permissions', JSON.stringify(permissions));
  }, [permissions]);

  const hasPermission = (role: keyof Permissions, feature: string): boolean => {
    // Admin has access to all features
    if (role === 'admin') return true;
    
    return permissions[role]?.includes(feature) || false;
  };

  const updateRolePermissions = (role: keyof Permissions, features: string[]) => {
    setPermissions(prev => ({
      ...prev,
      [role]: features,
    }));
  };

  const updateAllPermissions = (newPermissions: Permissions) => {
    setPermissions(newPermissions);
  };

  const value: PermissionsContextType = {
    permissions,
    hasPermission,
    updateRolePermissions,
    updateAllPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}