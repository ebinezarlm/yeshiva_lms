import { useState, useEffect } from "react";
import axios from "axios";
import { Video, Plus, Trash2, VideoIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Video as VideoType, InsertVideo } from "@shared/schema";

export default function TutorDashboard() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<InsertVideo>({
    title: "",
    description: "",
    videoUrl: "",
    category: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof InsertVideo, string>>>({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<VideoType[]>("/api/videos");
      setVideos(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof InsertVideo]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InsertVideo, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = "Video URL is required";
    } else {
      try {
        new URL(formData.videoUrl);
      } catch {
        newErrors.videoUrl = "Must be a valid URL";
      }
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post<VideoType>("/api/videos", formData);
      setVideos((prev) => [response.data, ...prev]);
      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        category: "",
      });
      toast({
        title: "Success",
        description: "Video added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/videos/${id}`);
      setVideos((prev) => prev.filter((video) => video.id !== id));
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
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

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Tutorial: "bg-blue-100 text-blue-800",
      Lecture: "bg-purple-100 text-purple-800",
      Demo: "bg-green-100 text-green-800",
      Review: "bg-amber-100 text-amber-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block mb-2 text-sm font-medium text-foreground"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                        errors.title ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Enter video title"
                      disabled={isSubmitting}
                      data-testid="input-video-title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-destructive" data-testid="error-title">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-foreground"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none ${
                        errors.description ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Enter video description"
                      disabled={isSubmitting}
                      data-testid="input-video-description"
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-destructive" data-testid="error-description">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="videoUrl"
                      className="block mb-2 text-sm font-medium text-foreground"
                    >
                      Video URL
                    </label>
                    <input
                      type="text"
                      id="videoUrl"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                        errors.videoUrl ? "border-destructive" : "border-input"
                      }`}
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={isSubmitting}
                      data-testid="input-video-url"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter YouTube or Vimeo URL
                    </p>
                    {errors.videoUrl && (
                      <p className="mt-1 text-xs text-destructive" data-testid="error-videoUrl">
                        {errors.videoUrl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block mb-2 text-sm font-medium text-foreground"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                        errors.category ? "border-destructive" : "border-input"
                      }`}
                      disabled={isSubmitting}
                      data-testid="select-video-category"
                    >
                      <option value="">Select a category</option>
                      <option value="Tutorial">Tutorial</option>
                      <option value="Lecture">Lecture</option>
                      <option value="Demo">Demo</option>
                      <option value="Review">Review</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-xs text-destructive" data-testid="error-category">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-add-video"
                  >
                    {isSubmitting ? (
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
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {videos.map((video) => {
                  const embedUrl = getEmbedUrl(video.videoUrl);
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
                          className={`${getCategoryColor(video.category)} mb-3`}
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
                          className="w-full"
                          data-testid={`button-delete-${video.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
