import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, PlaySquare, Eye, Video } from 'lucide-react';
import { format } from 'date-fns';
import { insertPlaylistSchema, type Playlist, type InsertPlaylist } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type PlaylistFormData = InsertPlaylist;

export default function AdminPlaylistsPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(insertPlaylistSchema),
    defaultValues: {
      name: '',
      description: '',
      tutorName: 'Admin',
      category: 'General',
      thumbnail: '',
      isPublic: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlaylistFormData) => {
      const response = await apiRequest('POST', '/api/playlists', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: 'Playlist created',
        description: 'The playlist has been created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to create playlist',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlaylistFormData }) => {
      const response = await apiRequest('PATCH', `/api/playlists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setEditingPlaylist(null);
      form.reset();
      toast({
        title: 'Playlist updated',
        description: 'The playlist has been updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update playlist',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setDeletingPlaylist(null);
      toast({
        title: 'Playlist deleted',
        description: 'The playlist has been removed',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to delete playlist',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: PlaylistFormData) => {
    if (editingPlaylist) {
      updateMutation.mutate({ id: editingPlaylist.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    form.reset({
      name: playlist.name,
      description: playlist.description || '',
      tutorName: playlist.tutorName,
      category: playlist.category,
      thumbnail: playlist.thumbnail || '',
      isPublic: playlist.isPublic,
    });
  };

  const handleDelete = (playlist: Playlist) => {
    setDeletingPlaylist(playlist);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Playlist Management</h1>
          <p className="text-muted-foreground">
            View and manage all course playlists on the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-playlist">
          <Plus className="h-4 w-4 mr-2" />
          Add New Playlist
        </Button>
      </div>

      {playlists.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <PlaySquare className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No playlists yet</h3>
            <p className="text-muted-foreground">Create your first playlist to get started</p>
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Playlist
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden hover-elevate" data-testid={`card-playlist-${playlist.id}`}>
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlaySquare className="h-16 w-16 text-white/80" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    <Video className="h-3 w-3 mr-1" />
                    {playlist.videoCount || 0} videos
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="line-clamp-1" data-testid={`text-playlist-title-${playlist.id}`}>
                    {playlist.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-fit">
                      {playlist.category}
                    </Badge>
                    <Badge variant="outline" className="w-fit">
                      {playlist.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>By {playlist.tutorName}</span>
                  <span>•</span>
                  <span>{format(new Date(playlist.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(playlist)}
                  className="flex-1"
                  data-testid={`button-edit-${playlist.id}`}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(playlist)}
                  data-testid={`button-delete-${playlist.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog || !!editingPlaylist} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingPlaylist(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-playlist-form">
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}</DialogTitle>
            <DialogDescription>
              {editingPlaylist ? 'Update playlist information' : 'Create a new course playlist'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduction to Programming" data-testid="input-playlist-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Learn programming fundamentals..."
                        rows={3}
                        data-testid="textarea-playlist-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tutorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutor Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-tutor-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-playlist-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Programming">Programming</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Math">Math</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-playlist-visibility">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Public</SelectItem>
                        <SelectItem value="0">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/image.jpg" data-testid="input-playlist-thumbnail" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setEditingPlaylist(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-playlist"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingPlaylist ? 'Save Changes' : 'Create Playlist'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlaylist} onOpenChange={() => setDeletingPlaylist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPlaylist?.name}"? This action cannot be undone and will remove all associated videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlaylist && deleteMutation.mutate(deletingPlaylist.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
