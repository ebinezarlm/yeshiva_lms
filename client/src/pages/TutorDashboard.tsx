import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Plus, Trash2, VideoIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Video as VideoType, InsertVideo } from "@shared/schema";
import { insertVideoSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TutorDashboard() {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: videos = [], isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const form = useForm<InsertVideo>({
    resolver: zodResolver(insertVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVideo) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      form.reset();
      toast({
        title: "Success",
        description: "Video added successfully",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      return await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setDeletingId(null);
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    },
    onError: () => {
      setDeletingId(null);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVideo) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        let videoId = "";
        if (urlObj.hostname.includes("youtu.be")) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get("v") || "";
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      
      if (urlObj.hostname.includes("vimeo.com")) {
        const videoId = urlObj.pathname.split("/").pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const getCategoryVariant = (category: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      Tutorial: "default",
      Lecture: "secondary",
      Demo: "outline",
      Review: "secondary",
    };
    return variants[category] || "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Video Management Dashboard
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Manage your educational video content
          </p>
          {videos.length > 0 && (
            <div className="mt-4">
              <Badge variant="secondary" data-testid="badge-video-count">
                Total Videos: {videos.length}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-8" data-testid="card-add-video-form">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-card-foreground">Add New Video</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter video title"
                              {...field}
                              disabled={createMutation.isPending}
                              data-testid="input-video-title"
                            />
                          </FormControl>
                          <FormMessage data-testid="error-title" />
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
                              placeholder="Enter video description"
                              rows={4}
                              {...field}
                              disabled={createMutation.isPending}
                              data-testid="input-video-description"
                            />
                          </FormControl>
                          <FormMessage data-testid="error-description" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://youtube.com/watch?v=..."
                              {...field}
                              disabled={createMutation.isPending}
                              data-testid="input-video-url"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter YouTube or Vimeo URL
                          </FormDescription>
                          <FormMessage data-testid="error-videoUrl" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={createMutation.isPending}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-video-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Tutorial" data-testid="option-category-tutorial">Tutorial</SelectItem>
                              <SelectItem value="Lecture" data-testid="option-category-lecture">Lecture</SelectItem>
                              <SelectItem value="Demo" data-testid="option-category-demo">Demo</SelectItem>
                              <SelectItem value="Review" data-testid="option-category-review">Review</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage data-testid="error-category" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                      data-testid="button-add-video"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Video
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden" data-testid={`skeleton-card-${i}`}>
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardContent className="p-5">
                      <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-4 bg-muted animate-pulse rounded w-20 mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-muted animate-pulse rounded" />
                        <div className="h-3 bg-muted animate-pulse rounded" />
                        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div
                className="bg-muted/30 rounded-lg p-12 text-center"
                data-testid="empty-state"
              >
                <VideoIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No videos yet</h3>
                <p className="text-muted-foreground">
                  Add your first educational video using the form
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const embedUrl = getEmbedUrl(video.videoUrl);
                  const isDeleting = deletingId === video.id;
                  
                  return (
                    <Card
                      key={video.id}
                      className="overflow-hidden hover-elevate transition-all duration-200"
                      data-testid={`card-video-${video.id}`}
                    >
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={video.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3
                          className="font-semibold text-lg mb-2 text-card-foreground line-clamp-2"
                          data-testid={`text-video-title-${video.id}`}
                        >
                          {video.title}
                        </h3>
                        <Badge
                          variant={getCategoryVariant(video.category)}
                          className="mb-3"
                          data-testid={`badge-category-${video.id}`}
                        >
                          {video.category}
                        </Badge>
                        <p
                          className="text-sm text-muted-foreground line-clamp-3"
                          data-testid={`text-video-description-${video.id}`}
                        >
                          {video.description}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          disabled={isDeleting}
                          className="w-full"
                          data-testid={`button-delete-${video.id}`}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
