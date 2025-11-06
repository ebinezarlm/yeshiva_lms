import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Video,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  PlaySquare,
  Upload,
  MessageSquare,
  DollarSign,
  UserCircle,
  Compass,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const adminMenuItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Access Control', icon: Shield, path: '/admin/access-control' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Playlists', icon: PlaySquare, path: '/admin/playlists' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const tutorMenuItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/tutor/dashboard' },
  { label: 'My Playlists', icon: PlaySquare, path: '/tutor/playlists' },
  { label: 'Upload Videos', icon: Upload, path: '/tutor/upload' },
  { label: 'Comments & Q&A', icon: MessageSquare, path: '/tutor/comments' },
  { label: 'Earnings', icon: DollarSign, path: '/tutor/earnings' },
  { label: 'Profile', icon: UserCircle, path: '/tutor/profile' },
];

const studentMenuItems: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'My Playlists', icon: PlaySquare, path: '/student/playlists' },
  { label: 'Explore', icon: Compass, path: '/student/explore' },
  { label: 'Subscriptions', icon: CreditCard, path: '/student/subscriptions' },
  { label: 'Q&A', icon: HelpCircle, path: '/student/qna' },
  { label: 'Profile', icon: UserCircle, path: '/student/profile' },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!user) return null;

  let menuItems: SidebarItem[];
  
  // Give admin users access to all admin features
  if (user.role === 'admin') {
    menuItems = adminMenuItems;
  } else if (user.role === 'tutor') {
    menuItems = tutorMenuItems.filter(item => hasPermission('tutor', item.label));
  } else {
    menuItems = studentMenuItems.filter(item => hasPermission('student', item.label));
  }

  return (
    <>
      {/* Mobile menu button - only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-background"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile by default, shown when mobile menu is open */}
      <aside
        className={cn(
          'bg-card border-r flex flex-col transition-all duration-300 h-screen sticky top-0 z-50',
          'fixed md:static',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        data-testid="sidebar-main"
      >
        <div className="p-4 border-b flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="font-bold text-lg">LMS</h2>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              data-testid="button-toggle-sidebar"
              className={cn(isCollapsed && 'mx-auto', 'hidden md:flex')}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isCollapsed && 'justify-center px-2'
                    )}
                    data-testid={`button-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">{user.name}</p>
              <p className="capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}