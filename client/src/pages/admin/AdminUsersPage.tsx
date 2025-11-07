import { useState, useEffect, ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Eye, Download, ChevronLeft, ChevronRight, UserPlus, X, Trash2, Pencil, Key, Check, AlertCircle, Shield, GraduationCap, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription, Playlist } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';

// Add ViewType enum
type ViewType = 'all' | 'tutors' | 'students' | 'my-tutors' | 'my-students';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Admin' | 'Tutor' | 'Student';
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy?: string;
}

// Define the role config type
interface RoleConfig {
  name: string;
  icon: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, "ref"> & React.RefAttributes<SVGSVGElement>>;
  color: string;
  availableFeatures: string[];
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'Admin' | 'Tutor' | 'Student'>('all');
  const [viewType, setViewType] = useState<ViewType>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [passwordResetStatus, setPasswordResetStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const itemsPerPage = 10;

  // Add user form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    role: 'Student' as 'Admin' | 'Tutor' | 'Student',
    status: 'active' as 'active' | 'inactive',
    address: '',
    dateOfBirth: '',
    gender: '',
    qualification: '',
    department: '',
    selectedFeatures: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const roleConfigs: Record<string, RoleConfig> = {
    Admin: {
      name: 'Admin',
      icon: Shield,
      color: 'bg-purple-100 text-purple-600',
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
    Tutor: {
      name: 'Tutor',
      icon: GraduationCap,
      color: 'bg-green-100 text-green-600',
      availableFeatures: [
        'Dashboard',
        'My Playlists',
        'Upload Videos',
        'Comments & Q&A',
        'Earnings',
        'Profile',
      ],
    },
    Student: {
      name: 'Student',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
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

  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  // Initialize with some mock users for demonstration
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '1234567890',
        role: 'Admin',
        status: 'active',
        createdAt: '2023-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        mobile: '0987654321',
        role: 'Tutor',
        status: 'active',
        createdAt: '2023-02-20T14:45:00Z'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        mobile: '1122334455',
        role: 'Student',
        status: 'inactive',
        createdAt: '2023-03-10T09:15:00Z'
      }
    ];
    setUsers(mockUsers);
  }, []);

  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile.includes(searchQuery);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      user.status === statusFilter;
      
    const matchesUserType = 
      userTypeFilter === 'all' || 
      user.role === userTypeFilter;

    return matchesSearch && matchesStatus && matchesUserType;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const downloadInvoice = (sub: Subscription) => {
    const invoice = `
INVOICE

Student: ${sub.studentName}
Email: ${sub.studentEmail}
Playlist: ${getPlaylistName(sub.playlistId)}

Subscription Details:
Start Date: ${format(new Date(sub.startDate), 'MMM dd, yyyy')}
End Date: ${format(new Date(sub.endDate), 'MMM dd, yyyy')}
Status: ${sub.status}

Amount Paid: ₹${sub.amountPaid}

Thank you for your subscription!
    `;
    
    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${sub.studentEmail}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile.replace(/[-\s]/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.selectedFeatures.length === 0) {
      newErrors.features = 'Please select at least one feature';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'Admin' | 'Tutor' | 'Student';
    setFormData(prev => ({
      ...prev,
      role: newRole,
      selectedFeatures: roleConfigs[newRole].availableFeatures
    }));
    
    if (errors.role || errors.features) {
      const newErrors = { ...errors };
      delete newErrors.role;
      delete newErrors.features;
      setErrors(newErrors);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedFeatures.includes(feature);
      const newFeatures = isSelected
        ? prev.selectedFeatures.filter(f => f !== feature)
        : [...prev.selectedFeatures, feature];
      
      return {
        ...prev,
        selectedFeatures: newFeatures
      };
    });

    if (errors.features) {
      const newErrors = { ...errors };
      delete newErrors.features;
      setErrors(newErrors);
    }
  };

  const handleSelectAll = () => {
    const allFeatures = roleConfigs[formData.role].availableFeatures;
    setFormData(prev => ({
      ...prev,
      selectedFeatures: allFeatures
    }));

    if (errors.features) {
      const newErrors = { ...errors };
      delete newErrors.features;
      setErrors(newErrors);
    }
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: []
    }));
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const sendWelcomeEmail = async (userData: any, tempPassword: string) => {
    const emailData = {
      to: userData.email,
      subject: 'Welcome to LMS Platform - Your Account Details',
      userName: userData.name,
      userEmail: userData.email,
      tempPassword: tempPassword,
      role: userData.role,
      loginUrl: 'https://your-lms-platform.com/login'
    };

    console.log('Email to be sent:', emailData);
    
    // Simulate API call to send email
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setSubmitStatus('processing');
      
      if (userToEdit) {
        // Update existing user
        const updatedUser: User = {
          ...userToEdit,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          status: formData.status,
        };
        
        setUsers(prev => prev.map(u => u.id === userToEdit.id ? updatedUser : u));
        
        setSubmitStatus('success');
        
        setTimeout(() => {
          setSubmitStatus(null);
          setShowAddUserDialog(false);
          setUserToEdit(null);
        }, 2000);
      } else {
        // Add new user by calling the backend API
        try {
          // First, get the role ID for the selected role
          const rolesResponse = await fetch('/api/roles');
          if (!rolesResponse.ok) {
            throw new Error('Failed to fetch roles');
          }
          
          const roles = await rolesResponse.json();
          const selectedRole = roles.find((r: any) => r.name.toLowerCase() === formData.role.toLowerCase());
          
          if (!selectedRole) {
            throw new Error(`Role ${formData.role} not found`);
          }
          
          // Prepare user data for submission
          const userData = {
            name: formData.name,
            email: formData.email,
            password: generateTempPassword(), // Generate a temporary password
            roleId: selectedRole.id,
            status: formData.status,
          };
          
          // Call the backend API to create the user
          const response = await fetch('/api/users/hierarchy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user');
          }
          
          const result = await response.json();
          
          // Add the new user to the users list
          const newUser: User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            mobile: formData.mobile,
            role: result.user.role,
            status: result.user.status,
            createdAt: result.user.createdAt,
            createdBy: result.user.createdBy,
          };
          
          setUsers(prev => [...prev, newUser]);
          
          setSubmitStatus('success');
          
          setTimeout(() => {
            setFormData({
              name: '',
              mobile: '',
              email: '',
              role: 'Student',
              status: 'active',
              address: '',
              dateOfBirth: '',
              gender: '',
              qualification: '',
              department: '',
              selectedFeatures: roleConfigs['Student'].availableFeatures
            });
            setSubmitStatus(null);
            setShowAddUserDialog(false);
          }, 2000);
        } catch (error) {
          console.error('Error creating user:', error);
          setSubmitStatus('error');
        }
      }
    } else {
      setSubmitStatus('error');
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      role: 'Student',
      status: 'active',
      address: '',
      dateOfBirth: '',
      gender: '',
      qualification: '',
      department: '',
      selectedFeatures: roleConfigs['Student'].availableFeatures
    });
    setErrors({});
    setSubmitStatus(null);
  };

  const handleDeleteUser = (user: User) => {
    // Check if user is active
    if (user.status === 'active') {
      // Show error message instead of opening delete confirmation
      setDeleteError('Cannot delete active users. Please deactivate the user first.');
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 3000);
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        const response = await fetch(`/api/users/${userToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete user');
        }
        
        // Refresh the user list
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        setDeleteError('Failed to delete user. Please try again.');
        setTimeout(() => {
          setDeleteError(null);
        }, 3000);
      }
    }
  };
  
  // Add new cascade delete handlers
  const handleCascadeDeleteUser = (user: User) => {
    // Check if user is active
    if (user.status === 'active') {
      // Show error message instead of opening delete confirmation
      setDeleteError('Cannot delete active users. Please deactivate the user first.');
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 3000);
      return;
    }
    setUserToDelete(user);
  };
  
  const confirmCascadeDeleteUser = async () => {
    if (userToDelete) {
      try {
        let response;
        
        // Determine the appropriate cascade delete endpoint based on user role
        if (userToDelete.role === 'Admin') {
          response = await cascadeDeleteAdmin(userToDelete.id);
        } else if (userToDelete.role === 'Tutor') {
          response = await cascadeDeleteTutor(userToDelete.id);
        } else {
          // For students, just do a regular delete
          response = await fetch(`/api/users/${userToDelete.id}`, {
            method: 'DELETE',
          });
        }
        
        if (!response.ok) {
          throw new Error('Failed to delete user');
        }
        
        // Refresh the user list
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        setDeleteError('Failed to delete user. Please try again.');
        setTimeout(() => {
          setDeleteError(null);
        }, 3000);
      }
    }
  };
  
  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    // Pre-fill the form with user data
    setFormData({
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      status: user.status,
      address: '',
      dateOfBirth: '',
      gender: '',
      qualification: '',
      department: '',
      selectedFeatures: [] // This would need to be populated from user data if available
    });
    setShowAddUserDialog(true);
  };

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
  };

  const confirmResetPassword = async () => {
    if (userToResetPassword) {
      // Simulate password reset process
      setPasswordResetStatus('processing');
      
      try {
        // In a real application, this would call an API to reset the password
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success message
        setPasswordResetStatus('success');
        
        // Clear the success message after 2 seconds
        setTimeout(() => {
          setPasswordResetStatus(null);
          setUserToResetPassword(null);
        }, 2000);
      } catch (error) {
        setPasswordResetStatus('error');
        console.error('Error resetting password:', error);
      }
    }
  };

  // Add API functions for user hierarchy
  const fetchAllUsers = async () => {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  };

  const fetchAllTutors = async () => {
    const response = await fetch('/api/users/tutors');
    if (!response.ok) throw new Error('Failed to fetch tutors');
    return response.json();
  };

  const fetchAllStudents = async () => {
    const response = await fetch('/api/users/students');
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  };

  const fetchTutorsByAdmin = async (adminId: string) => {
    const response = await fetch(`/api/users/admin/${adminId}/tutors`);
    if (!response.ok) throw new Error('Failed to fetch tutors');
    return response.json();
  };

  const fetchStudentsByTutor = async (tutorId: string) => {
    const response = await fetch(`/api/users/tutor/${tutorId}/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  };
  
  // Add new cascade delete API functions
  const deleteStudentsByTutor = async (tutorId: string) => {
    const response = await fetch(`/api/users/tutor/${tutorId}/students`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete students');
    return response.json();
  };
  
  const deleteTutorsByAdmin = async (adminId: string) => {
    const response = await fetch(`/api/users/admin/${adminId}/tutors`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete tutors');
    return response.json();
  };
  
  const cascadeDeleteTutor = async (tutorId: string) => {
    const response = await fetch(`/api/users/tutor/${tutorId}/cascade`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cascade delete tutor');
    return response.json();
  };
  
  const cascadeDeleteAdmin = async (adminId: string) => {
    const response = await fetch(`/api/users/admin/${adminId}/cascade`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cascade delete admin');
    return response.json();
  };
  
  // Use React Query to fetch users based on view type
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', viewType, currentUser?.id],
    queryFn: async () => {
      switch (viewType) {
        case 'all':
          return await fetchAllUsers();
        case 'tutors':
          return await fetchAllTutors();
        case 'students':
          return await fetchAllStudents();
        case 'my-tutors':
          return await fetchTutorsByAdmin(currentUser!.id);
        case 'my-students':
          return await fetchStudentsByTutor(currentUser!.id);
        default:
          return await fetchAllUsers();
      }
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">User Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          View and manage all registered users and their subscriptions
        </p>
      </div>

      {/* Error message for active user deletion attempt */}
      {deleteError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700 font-medium">{deleteError}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-xl">All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setShowAddUserDialog(true)} className="w-full md:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters moved below the Add New User button */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search"
              />
            </div>
            <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-view-type">
                <SelectValue placeholder="View Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="tutors">All Tutors</SelectItem>
                <SelectItem value="students">All Students</SelectItem>
                <SelectItem value="my-tutors">My Tutors</SelectItem>
                <SelectItem value="my-students">My Students</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-32" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={(value: any) => setUserTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-32" data-testid="select-user-type-filter">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Tutor">Tutor</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">Name</TableHead>
                      <TableHead className="text-xs md:text-sm">Email</TableHead>
                      <TableHead className="text-xs md:text-sm">Mobile Number</TableHead>
                      <TableHead className="text-xs md:text-sm">User Type</TableHead>
                      <TableHead className="text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-xs md:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium text-xs md:text-sm">{user.name}</TableCell>
                        <TableCell className="text-xs md:text-sm">{user.email}</TableCell>
                        <TableCell className="text-xs md:text-sm">{user.mobile}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <Badge variant="outline">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className={user.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-1 md:gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewUserDetails(user)}
                                    data-testid={`button-view-${user.id}`}
                                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    data-testid={`button-edit-${user.id}`}
                                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user)}
                                    data-testid={`button-delete-${user.id}`}
                                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResetPassword(user)}
                                    data-testid={`button-reset-password-${user.id}`}
                                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                                  >
                                    <Key className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset Password</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={(open) => {
        setShowAddUserDialog(open);
        if (!open) {
          // Reset the form when closing the dialog
          setUserToEdit(null);
          handleReset();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{userToEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>{userToEdit ? 'Update user account information' : 'Create a new user account for the LMS platform'}</DialogDescription>
          </DialogHeader>
          
          {submitStatus === 'processing' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">Creating user and sending welcome email...</p>
              </div>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                <div>
                  <p className="text-green-700 font-medium">User added successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Welcome email with temporary password has been sent to {formData.email}</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-700 font-medium">Please fix the errors below</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-200">
                Required Information <span className="text-red-500">*</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-800`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.mobile ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-800`}
                    placeholder="10-digit mobile number"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } placeholder-gray-800`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    {Object.entries(roleConfigs).map(([key, config]) => {
                      return (
                        <option key={key} value={key}>
                          {config.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {/* Status field - only shown when editing */}
                {userToEdit && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive (Terms Violation)</option>
                    </select>
                    {formData.status === 'inactive' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        User will be restricted from accessing the application due to violation of terms and conditions.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-200">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-gray-800"
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">Select gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-gray-800"
                    placeholder="Enter qualification"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-gray-800"
                    placeholder="Enter department"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b-2 border-indigo-200">
                  Role Permissions
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleConfigs[formData.role].availableFeatures.map((feature: string) => (
                  <div
                    key={feature}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition ${
                      formData.selectedFeatures.includes(feature)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFeatureToggle(feature)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.selectedFeatures.includes(feature)
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.selectedFeatures.includes(feature) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              {errors.features && (
                <p className="text-red-500 text-sm mt-2">{errors.features}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {userToEdit ? 'Update User' : 'Add User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the user</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mobile:</span>
                  <span className="text-sm">{selectedUser.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User Type:</span>
                  <Badge variant="outline">{selectedUser.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    variant={selectedUser.status === 'active' ? 'default' : 'secondary'}
                    className={selectedUser.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{format(new Date(selectedUser.createdAt), 'MMMM dd, yyyy')}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {userToDelete?.role === 'Admin' || userToDelete?.role === 'Tutor' 
                ? 'This user has created other users. Choose how to handle their associated users:'
                : 'Are you sure you want to delete this user? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">User:</span> {userToDelete.name} ({userToDelete.email})
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Role:</span> {userToDelete.role}
                </p>
              </div>
              
              {userToDelete.role === 'Admin' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Deleting this admin will also delete all tutors they created and all students created by those tutors.
                  </p>
                </div>
              )}
              
              {userToDelete.role === 'Tutor' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Deleting this tutor will also delete all students they created.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUserToDelete(null)}>
                  Cancel
                </Button>
                {(userToDelete.role === 'Admin' || userToDelete.role === 'Tutor') ? (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={confirmDeleteUser}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Only This User
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={confirmCascadeDeleteUser}
                      className="bg-red-800 hover:bg-red-900"
                    >
                      Delete With Associated Users
                    </Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={confirmDeleteUser}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <Dialog open={!!userToResetPassword} onOpenChange={() => {
        setUserToResetPassword(null);
        setPasswordResetStatus(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the password for this user? A temporary password will be generated and sent to their email.
            </DialogDescription>
          </DialogHeader>
          
          {userToResetPassword && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">User:</span> {userToResetPassword.name} ({userToResetPassword.email})
                </p>
              </div>
              
              {passwordResetStatus === 'processing' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-blue-700 text-sm">Resetting password and sending email...</p>
                </div>
              )}
              
              {passwordResetStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Check className="text-green-500 h-4 w-4" />
                  <p className="text-green-700 text-sm">Password reset successfully! Temporary password sent to user's email.</p>
                </div>
              )}
              
              {passwordResetStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="text-red-500 h-4 w-4" />
                  <p className="text-red-700 text-sm">Error resetting password. Please try again.</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUserToResetPassword(null);
                    setPasswordResetStatus(null);
                  }}
                  disabled={passwordResetStatus === 'processing'}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmResetPassword}
                  disabled={passwordResetStatus === 'processing'}
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}