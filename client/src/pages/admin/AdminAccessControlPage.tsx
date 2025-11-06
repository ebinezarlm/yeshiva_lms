import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Shield, GraduationCap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const roleConfig = {
  admin: {
    name: 'Admin',
    icon: Shield,
    color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
    availableFeatures: [
      'Dashboard',
      'Users',
      'Playlists',
      'Payments',
      'Invoices',
      'Analytics',
      'Settings',
    ],
  },
  tutor: {
    name: 'Tutor',
    icon: GraduationCap,
    color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
    availableFeatures: [
      'Dashboard',
      'My Playlists',
      'Upload Videos',
      'Comments & Q&A',
      'Earnings',
      'Profile',
    ],
  },
  student: {
    name: 'Student',
    icon: BookOpen,
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
    availableFeatures: [
      'Dashboard',
      'My Playlists',
      'Explore',
      'Subscriptions',
      'Q&A',
      'Profile',
    ],
  },
};

export default function AdminAccessControlPage() {
  const { permissions, updateAllPermissions } = usePermissions();
  const { toast } = useToast();
  const [localPermissions, setLocalPermissions] = useState(permissions);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    admin: true,
    tutor: true,
    student: true,
  });

  // Sync local permissions with context permissions when they change
  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  const handleFeatureToggle = (role: keyof typeof roleConfig, feature: string) => {
    setLocalPermissions((prev) => {
      const currentFeatures = prev[role];
      const isChecked = currentFeatures.includes(feature);

      return {
        ...prev,
        [role]: isChecked
          ? currentFeatures.filter((f) => f !== feature)
          : [...currentFeatures, feature],
      };
    });
  };

  const handleSaveChanges = () => {
    updateAllPermissions(localPermissions);

    toast({
      title: 'Changes Saved',
      description: 'Role permissions have been updated successfully',
    });

    console.log('Updated permissions:', localPermissions);
  };

  const toggleRoleExpansion = (role: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Access Control
        </h1>
        <p className="text-muted-foreground">
          Manage feature permissions for each role
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(roleConfig).map(([roleKey, config]) => {
          const Icon = config.icon;
          const role = roleKey as keyof typeof roleConfig;
          const selectedCount = localPermissions[role]?.length || 0;
          const totalCount = config.availableFeatures.length;
          const isExpanded = expandedRoles[role];

          return (
            <Card key={role} data-testid={`card-role-${role}`}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleRoleExpansion(role)}>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{config.name}</CardTitle>
                          <CardDescription>
                            {selectedCount} of {totalCount} features enabled
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" data-testid={`badge-count-${role}`}>
                          {selectedCount}/{totalCount}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {config.availableFeatures.map((feature) => {
                        const isChecked = localPermissions[role]?.includes(feature) || false;
                        return (
                          <div
                            key={feature}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate"
                            data-testid={`checkbox-container-${role}-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Checkbox
                              id={`${role}-${feature}`}
                              checked={isChecked}
                              onCheckedChange={() => handleFeatureToggle(role, feature)}
                              data-testid={`checkbox-${role}-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                            <Label
                              htmlFor={`${role}-${feature}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {feature}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setLocalPermissions(permissions)}
          data-testid="button-reset"
        >
          Reset Changes
        </Button>
        <Button onClick={handleSaveChanges} data-testid="button-save-changes">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Note</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Changes will take effect immediately for new sessions</li>
            <li>Users may need to log out and log back in to see updated permissions</li>
            <li>Permissions are stored locally in the browser (mock backend)</li>
            <li>Admin has access to all system management features</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}