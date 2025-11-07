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
import { Search, Eye, Download, ChevronLeft, ChevronRight, UserPlus, X, Trash2, Pencil, Key, Check, AlertCircle, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription, Playlist } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';

// Define the User type - tutors only work with students
interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Student'; // Tutors only work with students
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

export default function TutorUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [passwordResetStatus, setPasswordResetStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const itemsPerPage = 10;

  // Add user form state - tutors can only add students
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    role: 'Student' as 'Student',
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
  
  // Add API functions for user hierarchy
  const fetchStudentsByTutor = async (tutorId: string) => {
    const response = await fetch(`/api/users/tutor/${tutorId}/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  };

  // Use React Query to fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['students', currentUser?.id],
    queryFn: async () => {
      return await fetchStudentsByTutor(currentUser!.id);
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  const getPlaylistName = (playlistId: string) => {
    return 'Unknown Playlist';
  };

  // Remove the handleRoleChange function since it references undefined roleConfigs
  // Remove the handleFeatureToggle function since it references undefined roleConfigs
  // Remove the handleSelectAll function since it references undefined roleConfigs
  // Remove the handleDeselectAll function since it references undefined roleConfigs
  
  // Update the handleRoleChange function to not reference roleConfigs
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'Student';
    setFormData(prev => ({
      ...prev,
      role: newRole
    }));
    
    if (errors.role || errors.features) {
      const newErrors = { ...errors };
      delete newErrors.role;
      delete newErrors.features;
      setErrors(newErrors);
    }
  };

  const filteredUsers = users.filter((user) => {
    // Tutors can only see students
    if (user.role !== 'Student') return false;
    
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile.includes(searchQuery);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      user.status === statusFilter;

    return matchesSearch && matchesStatus;
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
        // Add new student by calling the backend API
        try {
          // Prepare student data for submission
          const studentData = {
            name: formData.name,
            email: formData.email,
            password: generateTempPassword(), // Generate a temporary password
            status: formData.status,
          };
          
          // Call the backend API to create the student
          const response = await fetch('/api/users/tutor-student', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create student');
          }
          
          const result = await response.json();
          
          // Add the new student to the users list
          const newStudent: User = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            mobile: formData.mobile,
            role: 'Student',
            status: result.user.status,
            createdAt: result.user.createdAt,
            createdBy: result.user.createdBy,
          };
          
          setUsers(prev => [...prev, newStudent]);
          
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
              selectedFeatures: []
            });
            setSubmitStatus(null);
            setShowAddUserDialog(false);
          }, 2000);
        } catch (error) {
          console.error('Error creating student:', error);
          setSubmitStatus('error');
        }
      }
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
      selectedFeatures: []
    });
    setErrors({});
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
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
      selectedFeatures: []
    });
    setShowAddUserDialog(true);
  };

  const handleDeleteUser = (user: User) => {
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
        queryClient.invalidateQueries({ queryKey: ['students'] });
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

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
    setPasswordResetStatus('processing');
    
    // Simulate password reset
    setTimeout(() => {
      setPasswordResetStatus('success');
      
      setTimeout(() => {
        setUserToResetPassword(null);
        setPasswordResetStatus(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Student Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          View and manage students assigned to you
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
            <CardTitle className="text-xl">My Students</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setShowAddUserDialog(true)} className="w-full md:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search"
              />
            </div>
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
          </div>
          
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students found</p>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} students
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
            <DialogTitle>{userToEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>{userToEdit ? 'Update student account information' : 'Create a new student account for the LMS platform'}</DialogDescription>
          </DialogHeader>
          
          {submitStatus === 'processing' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">Creating student and sending welcome email...</p>
              </div>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                <div>
                  <p className="text-green-700 font-medium">Student added successfully!</p>
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
                    placeholder="Enter 10-digit mobile number"
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
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
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
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddUserDialog(false);
                  handleReset();
                }}
                className="px-6"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="px-6 bg-indigo-600 hover:bg-indigo-700"
              >
                {userToEdit ? 'Update Student' : 'Add Student'}
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
            <DialogDescription>View detailed information about this user</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedUser.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline">{selectedUser.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={selectedUser.status === 'active' ? 'default' : 'secondary'}
                    className={selectedUser.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{format(new Date(selectedUser.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={() => setSelectedUser(null)} className="w-full">
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
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Student:</span> {userToDelete.name} ({userToDelete.email})
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUserToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!userToResetPassword} onOpenChange={() => {
        setUserToResetPassword(null);
        setPasswordResetStatus(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {passwordResetStatus === 'success' 
                ? 'Password reset successful!' 
                : 'Generate a new temporary password for this user'}
            </DialogDescription>
          </DialogHeader>
          
          {userToResetPassword && (
            <div className="space-y-4">
              {passwordResetStatus === 'processing' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-blue-700 font-medium">Generating new password and sending email...</p>
                  </div>
                </div>
              )}
              
              {passwordResetStatus === 'success' && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-center gap-2">
                    <Check className="text-green-500" size={20} />
                    <div>
                      <p className="text-green-700 font-medium">Password reset successful!</p>
                      <p className="text-green-600 text-sm mt-1">A new temporary password has been sent to {userToResetPassword.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {passwordResetStatus === null && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    You are about to reset the password for <span className="font-semibold">{userToResetPassword.name}</span>. 
                    A new temporary password will be generated and sent to their email address.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                {passwordResetStatus === null && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUserToResetPassword(null);
                        setPasswordResetStatus(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleResetPassword(userToResetPassword)}
                    >
                      Reset Password
                    </Button>
                  </>
                )}
                
                {passwordResetStatus === 'success' && (
                  <Button
                    onClick={() => {
                      setUserToResetPassword(null);
                      setPasswordResetStatus(null);
                    }}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}