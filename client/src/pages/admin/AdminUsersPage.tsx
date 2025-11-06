import { useState, useEffect, ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Download, ChevronLeft, ChevronRight, UserPlus, X, Check, AlertCircle, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription, Playlist } from '@shared/schema';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Admin' | 'Tutor' | 'Student';
  status: 'active' | 'inactive';
  createdAt: string;
}

// Define the role config type
interface RoleConfig {
  name: string;
  icon: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, "ref"> & React.RefAttributes<SVGSVGElement>>;
  color: string;
  availableFeatures: string[];
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'Admin' | 'Tutor' | 'Student'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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
    address: '',
    dateOfBirth: '',
    gender: '',
    qualification: '',
    department: '',
    selectedFeatures: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

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
      
      const tempPassword = generateTempPassword();
      
      const userData = {
        ...formData,
        tempPassword: tempPassword,
        createdAt: new Date().toISOString()
      };

      console.log('User data to be submitted:', userData);

      try {
        await sendWelcomeEmail(userData, tempPassword);
        
        // Add the new user to the users list
        const newUser: User = {
          id: `${users.length + 1}`,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        setUsers(prev => [...prev, newUser]);
        
        setSubmitStatus('success');
        
        setTimeout(() => {
          setFormData({
            name: '',
            mobile: '',
            email: '',
            role: 'Student',
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
        console.error('Error sending email:', error);
        setSubmitStatus('error');
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
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">User Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          View and manage all registered users and their subscriptions
        </p>
      </div>

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
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
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
                          <div className="flex gap-1 md:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewUserDetails(user)}
                              data-testid={`button-view-${user.id}`}
                              className="h-8 px-2 text-xs md:h-9 md:px-4 md:text-sm"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              data-testid={`button-delete-${user.id}`}
                              className="h-8 px-2 text-xs md:h-9 md:px-4 md:text-sm"
                            >
                              <X className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
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
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account for the LMS platform</DialogDescription>
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
                    }`}
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
                    }`}
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
                    }`}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                Add User
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
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">User:</span> {userToDelete.name} ({userToDelete.email})
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
    </div>
  );
}