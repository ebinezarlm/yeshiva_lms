import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVideoSchema, insertPlaylistSchema, type Playlist, type Video } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Plus } from "lucide-react";

interface PlaylistWithVideos extends Playlist {
  videos: Video[];
}

const addVideoFormSchema = insertVideoSchema.extend({
  playlistId: z.string().optional(),
  newPlaylistName: z.string().optional(),
});

type AddVideoFormData = z.infer<typeof addVideoFormSchema>;

export default function VideoPlaylistManager() {
  const { toast } = useToast();
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const { data: playlists = [], isLoading } = useQuery<PlaylistWithVideos[]>({
    queryKey: ["/api/playlists"],
  });

  const form = useForm<AddVideoFormData>({
    resolver: zodResolver(addVideoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      category: "",
      playlistId: "",
      newPlaylistName: "",
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/playlists", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; videoUrl: string; category: string; playlistId?: string }) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      form.reset();
      setShowNewPlaylistInput(false);
      toast({
        title: "Success",
        description: "Video added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("DELETE", `/api/videos/${videoId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const convertDriveUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("drive.google.com")) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          return `https://drive.google.com/uc?export=preview&id=${fileIdMatch[1]}`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  const onSubmit = async (data: AddVideoFormData) => {
    try {
      let playlistId = data.playlistId;

      if (showNewPlaylistInput && data.newPlaylistName) {
        const newPlaylist = await createPlaylistMutation.mutateAsync({
          name: data.newPlaylistName,
          description: "",
        });
        playlistId = newPlaylist.id;
      }

      const convertedUrl = convertDriveUrl(data.videoUrl);

      await createVideoMutation.mutateAsync({
        title: data.title,
        description: data.description,
        videoUrl: convertedUrl,
        category: data.category,
        playlistId: playlistId || undefined,
      });
    } catch (error) {
      console.error("Error adding video:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card data-testid="card-add-video">
        <CardHeader>
          <CardTitle>Add Video to Playlist</CardTitle>
          <CardDescription>Upload a new video and assign it to a playlist</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter video title" data-testid="input-video-title" />
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
                      <Textarea {...field} placeholder="Enter video description" rows={3} data-testid="input-video-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (from Drive)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://drive.google.com/file/d/FILE_ID/view" data-testid="input-video-url" />
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
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tutorial">Tutorial</SelectItem>
                        <SelectItem value="Lecture">Lecture</SelectItem>
                        <SelectItem value="Demo">Demo</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!showNewPlaylistInput ? (
                <>
                  <FormField
                    control={form.control}
                    name="playlistId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Playlist</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-playlist">
                              <SelectValue placeholder="Select a playlist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {playlists.map((playlist) => (
                              <SelectItem key={playlist.id} value={playlist.id}>
                                {playlist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPlaylistInput(true)}
                    className="w-full"
                    data-testid="button-create-new-playlist"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Playlist
                  </Button>
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="newPlaylistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Playlist Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter new playlist name" data-testid="input-new-playlist-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPlaylistInput(false)}
                    className="w-full"
                    data-testid="button-cancel-new-playlist"
                  >
                    Cancel - Select Existing Playlist
                  </Button>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createVideoMutation.isPending || createPlaylistMutation.isPending}
                data-testid="button-add-video"
              >
                {createVideoMutation.isPending || createPlaylistMutation.isPending ? "Adding..." : "Add Video"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold" data-testid="text-playlists-title">Playlists</h2>
        {playlists.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No playlists yet. Create one when adding a video!</p>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {playlists.map((playlist) => (
              <AccordionItem key={playlist.id} value={playlist.id} className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline" data-testid={`accordion-trigger-${playlist.id}`}>
                  <div className="flex flex-col items-start">
                    <h3 className="text-lg font-semibold">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.videos.length} {playlist.videos.length === 1 ? "video" : "videos"}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {playlist.videos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No videos in this playlist yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {playlist.videos.map((video) => (
                        <Card key={video.id} data-testid={`card-playlist-video-${video.id}`}>
                          <div className="aspect-video bg-muted overflow-hidden">
                            <iframe
                              src={video.videoUrl}
                              className="w-full h-full"
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base line-clamp-1">{video.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{video.description}</CardDescription>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteVideoMutation.mutate(video.id)}
                                disabled={deleteVideoMutation.isPending}
                                data-testid={`button-delete-video-${video.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
