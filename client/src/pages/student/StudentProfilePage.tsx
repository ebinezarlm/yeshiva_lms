import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Mail, Lock, Bell, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  profilePicture: z.string().url().optional().or(z.literal('')),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailPreferences, setEmailPreferences] = useState({
    newContent: true,
    assignments: true,
    messages: false,
    newsletter: true,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      profilePicture: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = (data: ProfileFormData) => {
    console.log('Profile data:', data);
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully',
    });
  };

  const handlePasswordSubmit = (data: PasswordFormData) => {
    console.log('Password data:', data);
    toast({
      title: 'Password changed',
      description: 'Your password has been changed successfully',
    });
    passwordForm.reset();
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Preferences saved',
      description: 'Your email preferences have been updated',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileForm.watch('profilePicture')} />
                  <AvatarFallback className="text-2xl">
                    {user?.name ? getInitials(user.name) : 'ST'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <FormField
                    control={profileForm.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/avatar.jpg"
                            data-testid="input-profile-picture"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter a URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="student@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" data-testid="button-save-profile">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter current password"
                        data-testid="input-current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password"
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" data-testid="button-change-password">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Choose what emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="new-content"
                  checked={emailPreferences.newContent}
                  onCheckedChange={(checked) =>
                    setEmailPreferences(prev => ({ ...prev, newContent: checked as boolean }))
                  }
                  data-testid="checkbox-new-content"
                />
                <div className="space-y-1">
                  <Label htmlFor="new-content" className="font-medium cursor-pointer">
                    New Course Content
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new videos are added to your subscribed playlists
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="assignments"
                  checked={emailPreferences.assignments}
                  onCheckedChange={(checked) =>
                    setEmailPreferences(prev => ({ ...prev, assignments: checked as boolean }))
                  }
                  data-testid="checkbox-assignments"
                />
                <div className="space-y-1">
                  <Label htmlFor="assignments" className="font-medium cursor-pointer">
                    Course Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about incomplete courses
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="messages"
                  checked={emailPreferences.messages}
                  onCheckedChange={(checked) =>
                    setEmailPreferences(prev => ({ ...prev, messages: checked as boolean }))
                  }
                  data-testid="checkbox-messages"
                />
                <div className="space-y-1">
                  <Label htmlFor="messages" className="font-medium cursor-pointer">
                    Q&A Responses
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tutors answer your questions
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="newsletter"
                  checked={emailPreferences.newsletter}
                  onCheckedChange={(checked) =>
                    setEmailPreferences(prev => ({ ...prev, newsletter: checked as boolean }))
                  }
                  data-testid="checkbox-newsletter"
                />
                <div className="space-y-1">
                  <Label htmlFor="newsletter" className="font-medium cursor-pointer">
                    Newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly newsletter with learning tips and platform updates
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" data-testid="button-save-preferences">
                <Bell className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
