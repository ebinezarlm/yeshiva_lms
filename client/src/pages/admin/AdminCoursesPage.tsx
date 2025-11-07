import { useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';

interface Course {
  id: string;
  course_title: string;
  course_code: string;
  category_id: string;
  description: string;
  learning_outcomes: string[];
  difficulty_level: string;
  target_audience: string;
  prerequisites: string;
  duration_hours: number;
  course_thumbnail: string;
  is_self_paced: boolean;
  created_at: string;
}

const mockCourses: Course[] = [
  {
    id: '1',
    course_title: 'Introduction to React',
    course_code: 'CS101',
    category_id: 'web-development',
    description: 'Learn the fundamentals of React.js',
    learning_outcomes: ['Understand React components', 'Learn state management', 'Build interactive UIs'],
    difficulty_level: 'Beginner',
    target_audience: 'Beginner developers',
    prerequisites: 'Basic JavaScript knowledge',
    duration_hours: 20,
    course_thumbnail: '/placeholder.jpg',
    is_self_paced: true,
    created_at: '2023-01-15T10:30:00Z'
  },
  {
    id: '2',
    course_title: 'Advanced TypeScript',
    course_code: 'CS201',
    category_id: 'programming',
    description: 'Master advanced TypeScript concepts',
    learning_outcomes: ['Advanced type system', 'Generics', 'Decorators'],
    difficulty_level: 'Advanced',
    target_audience: 'Experienced developers',
    prerequisites: 'Intermediate JavaScript and basic TypeScript',
    duration_hours: 25,
    course_thumbnail: '/placeholder.jpg',
    is_self_paced: false,
    created_at: '2023-02-20T14:45:00Z'
  }
];

const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];
const categories = [
  { id: 'web-development', name: 'Web Development' },
  { id: 'programming', name: 'Programming' },
  { id: 'data-science', name: 'Data Science' },
  { id: 'design', name: 'Design' }
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  
  // Add state for new category
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    course_title: '',
    course_code: '',
    category_id: '',
    description: '',
    learning_outcomes: [''],
    difficulty_level: 'Beginner',
    target_audience: '',
    prerequisites: '',
    duration_hours: 0,
    course_thumbnail: '',
    is_self_paced: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCourses = courses.filter(course => 
    course.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.course_title.trim()) {
      newErrors.course_title = 'Course title is required';
    }
    
    if (!formData.course_code.trim()) {
      newErrors.course_code = 'Course code is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleLearningOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...formData.learning_outcomes];
    newOutcomes[index] = value;
    setFormData(prev => ({
      ...prev,
      learning_outcomes: newOutcomes
    }));
  };

  const addLearningOutcome = () => {
    setFormData(prev => ({
      ...prev,
      learning_outcomes: [...prev.learning_outcomes, '']
    }));
  };

  const removeLearningOutcome = (index: number) => {
    const newOutcomes = [...formData.learning_outcomes];
    newOutcomes.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      learning_outcomes: newOutcomes
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (editingCourse) {
        // Update existing course
        const updatedCourse: Course = {
          ...editingCourse,
          ...formData,
          learning_outcomes: formData.learning_outcomes.filter(outcome => outcome.trim() !== '')
        };
        
        setCourses(prev => prev.map(course => 
          course.id === editingCourse.id ? updatedCourse : course
        ));
        
        setEditingCourse(null);
      } else {
        // Add new course
        const newCourse: Course = {
          id: `${courses.length + 1}`,
          ...formData,
          learning_outcomes: formData.learning_outcomes.filter(outcome => outcome.trim() !== ''),
          created_at: new Date().toISOString()
        };
        
        setCourses(prev => [...prev, newCourse]);
      }
      
      // Reset form
      setFormData({
        course_title: '',
        course_code: '',
        category_id: '',
        description: '',
        learning_outcomes: [''],
        difficulty_level: 'Beginner',
        target_audience: '',
        prerequisites: '',
        duration_hours: 0,
        course_thumbnail: '',
        is_self_paced: false
      });
      
      setShowAddDialog(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_title: course.course_title,
      course_code: course.course_code,
      category_id: course.category_id,
      description: course.description,
      learning_outcomes: course.learning_outcomes.length > 0 ? course.learning_outcomes : [''],
      difficulty_level: course.difficulty_level,
      target_audience: course.target_audience,
      prerequisites: course.prerequisites,
      duration_hours: course.duration_hours,
      course_thumbnail: course.course_thumbnail,
      is_self_paced: course.is_self_paced
    });
    setShowAddDialog(true);
  };

  const handleDelete = () => {
    if (deletingCourse) {
      setCourses(prev => prev.filter(course => course.id !== deletingCourse.id));
      setDeletingCourse(null);
    }
  };

  const resetForm = () => {
    setFormData({
      course_title: '',
      course_code: '',
      category_id: '',
      description: '',
      learning_outcomes: [''],
      difficulty_level: 'Beginner',
      target_audience: '',
      prerequisites: '',
      duration_hours: 0,
      course_thumbnail: '',
      is_self_paced: false
    });
    setErrors({});
    setEditingCourse(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">Create, edit, and manage courses</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>All Courses</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Duration (hrs)</TableHead>
                    <TableHead>Self-Paced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.course_title}</TableCell>
                      <TableCell>{course.course_code}</TableCell>
                      <TableCell>
                        {categories.find(c => c.id === course.category_id)?.name || course.category_id}
                      </TableCell>
                      <TableCell>{course.difficulty_level}</TableCell>
                      <TableCell>{course.duration_hours}</TableCell>
                      <TableCell>
                        {course.is_self_paced ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingCourse(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Course Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course information' : 'Create a new course'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course_title">Course Title *</Label>
                  <Input
                    id="course_title"
                    name="course_title"
                    value={formData.course_title}
                    onChange={handleChange}
                    className={errors.course_title ? 'border-red-500' : ''}
                  />
                  {errors.course_title && (
                    <p className="text-red-500 text-sm mt-1">{errors.course_title}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="course_code">Course Code *</Label>
                  <Input
                    id="course_code"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleChange}
                    className={errors.course_code ? 'border-red-500' : ''}
                  />
                  {errors.course_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.course_code}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="category_id">Category *</Label>
                  <div className="flex gap-2">
                    <Select 
                      name="category_id" 
                      value={formData.category_id} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, category_id: value }));
                        if (errors.category_id) {
                          const newErrors = { ...errors };
                          delete newErrors.category_id;
                          setErrors(newErrors);
                        }
                      }}
                    >
                      <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="add-new">+ Add New Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.category_id === 'add-new' && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddCategory(true)}
                        className="whitespace-nowrap"
                      >
                        Create
                      </Button>
                    )}
                  </div>
                  {errors.category_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="difficulty_level">Difficulty Level</Label>
                  <Select 
                    name="difficulty_level" 
                    value={formData.difficulty_level} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
              <div className="space-y-2">
                {formData.learning_outcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={outcome}
                      onChange={(e) => handleLearningOutcomeChange(index, e.target.value)}
                      placeholder={`Learning outcome ${index + 1}`}
                    />
                    {formData.learning_outcomes.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeLearningOutcome(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLearningOutcome}
                  className="mt-2"
                >
                  Add Learning Outcome
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Input
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prerequisites">Prerequisites</Label>
                  <Input
                    id="prerequisites"
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration_hours">Duration (hours) *</Label>
                  <Input
                    id="duration_hours"
                    name="duration_hours"
                    type="number"
                    value={formData.duration_hours || ''}
                    onChange={handleChange}
                    className={errors.duration_hours ? 'border-red-500' : ''}
                  />
                  {errors.duration_hours && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration_hours}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_self_paced"
                    checked={formData.is_self_paced}
                    onCheckedChange={(checked) => handleSwitchChange('is_self_paced', checked)}
                  />
                  <Label htmlFor="is_self_paced">Self-Paced</Label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Thumbnail</h3>
              <div className="flex items-center gap-4">
                <div className="border-2 border-dashed rounded-lg p-4 flex-1">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload course thumbnail</p>
                    <Button variant="outline" size="sm">Choose File</Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
              >
                {editingCourse ? 'Update Course' : 'Add Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for courses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCategoryName">Category Name *</Label>
              <Input
                id="newCategoryName"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddCategory(false);
                setNewCategory('');
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (newCategory.trim()) {
                  // In a real app, this would call an API to create the category
                  const newCategoryId = newCategory.toLowerCase().replace(/\s+/g, '-');
                  // For now, we'll just update the form data
                  setFormData(prev => ({ ...prev, category_id: newCategoryId }));
                  setNewCategory('');
                  setShowAddCategory(false);
                }
              }}>
                Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deletingCourse && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Course:</span> {deletingCourse.course_title} ({deletingCourse.course_code})
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeletingCourse(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
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