import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Youtube, Video, Upload, Plus, X } from "lucide-react";
import type { Playlist } from "@shared/schema";

type VideoSource = "youtube" | "drive" | "upload";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["Tutorial", "Lecture", "Demo", "Review"], {
    required_error: "Category is required",
  }),
  videoUrl: z.string().optional(),
  playlistId: z.string().optional(),
  newPlaylistName: z.string().optional(),
  newPlaylistDescription: z.string().optional(),
});

type VideoFormData = z.infer<typeof formSchema>;

function convertDriveUrl(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=preview&id=${match[1]}`;
    }
  }

  return null;
}

function getEmbedUrl(url: string, source: VideoSource): string {
  if (source === "drive") {
    const converted = convertDriveUrl(url);
    return converted || url;
  }

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be")
      ? url.split("/").pop()?.split("?")[0]
      : new URLSearchParams(url.split("?")[1]).get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop();
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
}

export default function UnifiedVideoManager() {
  const { toast } = useToast();
  const [videoSource, setVideoSource] = useState<VideoSource>("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreatingNewPlaylist, setIsCreatingNewPlaylist] = useState(false);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      videoUrl: "",
      playlistId: undefined,
      newPlaylistName: "",
      newPlaylistDescription: "",
    },
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
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
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Success",
        description: "Video added successfully!",
      });
      handleReset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const uploadVideoMutation = useMutation<any, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("POST", "/api/videos/upload");
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      handleReset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleReset = () => {
    form.reset();
    setVideoUrl("");
    setPreviewUrl("");
    setSelectedFile(null);
    setUploadProgress(0);
    setIsCreatingNewPlaylist(false);
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    if (url.trim()) {
      setPreviewUrl(getEmbedUrl(url, videoSource));
    } else {
      setPreviewUrl("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const onSubmit = async (data: VideoFormData) => {
    let playlistId = data.playlistId;

    if (isCreatingNewPlaylist && data.newPlaylistName) {
      try {
        const newPlaylist = await createPlaylistMutation.mutateAsync({
          name: data.newPlaylistName,
          description: data.newPlaylistDescription,
        });
        playlistId = newPlaylist.id;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create playlist",
          variant: "destructive",
        });
        return;
      }
    }

    if (videoSource === "upload") {
      if (!selectedFile) {
        toast({
          title: "Error",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      if (playlistId) {
        formData.append("playlistId", playlistId);
      }

      await uploadVideoMutation.mutateAsync(formData);
    } else {
      let finalVideoUrl = videoUrl;
      if (videoSource === "drive") {
        const converted = convertDriveUrl(videoUrl);
        if (!converted) {
          toast({
            title: "Error",
            description: "Invalid Google Drive URL",
            variant: "destructive",
          });
          return;
        }
        finalVideoUrl = converted;
      }

      if (!finalVideoUrl) {
        toast({
          title: "Error",
          description: "Please provide a video URL",
          variant: "destructive",
        });
        return;
      }

      await createVideoMutation.mutateAsync({
        ...data,
        videoUrl: finalVideoUrl,
        playlistId,
      });
    }
  };

  const handleSourceChange = (source: VideoSource) => {
    setVideoSource(source);
    setVideoUrl("");
    setPreviewUrl("");
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Card className="shadow-lg max-w-3xl mx-auto" data-testid="card-unified-video-manager">
      <CardHeader>
        <CardTitle>Add New Video</CardTitle>
        <CardDescription>
          Upload videos from YouTube, Vimeo, Google Drive, or upload directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Video Source Tabs */}
          <div>
            <Label>Video Source</Label>
            <Tabs value={videoSource} onValueChange={(v) => handleSourceChange(v as VideoSource)} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="youtube" data-testid="tab-youtube-vimeo">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube / Vimeo
                </TabsTrigger>
                <TabsTrigger value="drive" data-testid="tab-google-drive">
                  <Video className="w-4 h-4 mr-2" />
                  Google Drive
                </TabsTrigger>
                <TabsTrigger value="upload" data-testid="tab-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube / Vimeo URL</Label>
                  <Input
                    id="youtube-url"
                    data-testid="input-youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste a YouTube or Vimeo video link
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="drive" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="drive-url">Google Drive URL</Label>
                  <Input
                    id="drive-url"
                    data-testid="input-drive-url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Make sure the video is shared with "Anyone with the link"
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload Video File</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer transition-colors"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    data-testid="dropzone-upload"
                  >
                    <Input
                      id="file-upload"
                      data-testid="input-file-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {selectedFile ? (
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium mb-1">Click to upload a video</p>
                        <p className="text-xs text-muted-foreground">
                          MP4, WebM, or OGG (max 100MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          {previewUrl && (
            <div>
              <Label>Preview</Label>
              <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video">
                {videoSource === "upload" ? (
                  <video
                    controls
                    className="w-full h-full"
                    src={previewUrl}
                    data-testid="preview-video"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="preview-iframe"
                  />
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="mt-2" data-testid="progress-upload" />
              <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                data-testid="input-title"
                placeholder="Enter video title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                data-testid="input-description"
                placeholder="Enter video description"
                rows={4}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as any)}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Lecture">Lecture</SelectItem>
                  <SelectItem value="Demo">Demo</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            {/* Playlist Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Playlist (Optional)</Label>
                {!isCreatingNewPlaylist && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingNewPlaylist(true)}
                    data-testid="button-create-new-playlist"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Playlist
                  </Button>
                )}
              </div>

              {isCreatingNewPlaylist ? (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Create New Playlist</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreatingNewPlaylist(false);
                        form.setValue("newPlaylistName", "");
                        form.setValue("newPlaylistDescription", "");
                      }}
                      data-testid="button-cancel-new-playlist"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Playlist name"
                    data-testid="input-new-playlist-name"
                    {...form.register("newPlaylistName")}
                  />
                  <Input
                    placeholder="Playlist description (optional)"
                    data-testid="input-new-playlist-description"
                    {...form.register("newPlaylistDescription")}
                  />
                </div>
              ) : (
                <Select
                  value={form.watch("playlistId")}
                  onValueChange={(value) => form.setValue("playlistId", value)}
                >
                  <SelectTrigger data-testid="select-playlist">
                    <SelectValue placeholder="Select playlist or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                createVideoMutation.isPending ||
                uploadVideoMutation.isPending ||
                createPlaylistMutation.isPending
              }
              data-testid="button-submit"
            >
              {uploadVideoMutation.isPending
                ? "Uploading..."
                : createVideoMutation.isPending
                ? "Adding..."
                : "Add Video"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
