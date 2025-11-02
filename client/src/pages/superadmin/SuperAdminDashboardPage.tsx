import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, GraduationCap, BookOpen, Activity } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: Users,
      description: 'All platform users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Admins',
      value: '12',
      icon: Shield,
      description: 'Platform administrators',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Tutors',
      value: '89',
      icon: GraduationCap,
      description: 'Content creators',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Students',
      value: '1,133',
      icon: BookOpen,
      description: 'Active learners',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'System Status',
      value: 'Healthy',
      icon: Activity,
      description: 'All systems operational',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          System-wide overview and access control management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="button-manage-access">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Manage Access Control</div>
                  <div className="text-sm text-muted-foreground">Configure role permissions</div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="button-system-logs">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">System Logs</div>
                  <div className="text-sm text-muted-foreground">View platform activity</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-medium">423</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Playlists</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Videos</span>
                <span className="font-medium">2,847</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="font-medium">234 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
