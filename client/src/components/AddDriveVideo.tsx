import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Loader2, Video } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Google Drive link validation and conversion
function extractDriveFileId(url: string): string | null {
  // Support multiple Google Drive URL formats:
  // 1. https://drive.google.com/file/d/FILE_ID/view
  // 2. https://drive.google.com/open?id=FILE_ID
  // 3. https://drive.google.com/uc?id=FILE_ID
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,  // /file/d/FILE_ID format
    /[?&]id=([a-zA-Z0-9_-]+)/,      // ?id=FILE_ID format
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

function convertToEmbedUrl(driveUrl: string): string | null {
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) return null;
  
  // Use the current (2025) Google Drive embed format
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Form validation schema
const driveVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  driveUrl: z.string().url("Must be a valid URL").refine(
    (url) => {
      return url.includes("drive.google.com") && extractDriveFileId(url) !== null;
    },
    { message: "Must be a valid Google Drive link" }
  ),
  category: z.string().min(1, "Category is required"),
});

type DriveVideoForm = z.infer<typeof driveVideoSchema>;

export default function AddDriveVideo() {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<DriveVideoForm>({
    resolver: zodResolver(driveVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      driveUrl: "",
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DriveVideoForm) => {
      const embedUrl = convertToEmbedUrl(data.driveUrl);
      if (!embedUrl) {
        throw new Error("Invalid Google Drive URL");
      }

      const videoData = {
        title: data.title,
        description: data.description,
        videoUrl: embedUrl,
        category: data.category,
      };

      const response = await apiRequest("POST", "/api/videos", videoData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      form.reset();
      setPreviewUrl(null);
      toast({
        title: "Success",
        description: "Video from Google Drive added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DriveVideoForm) => {
    createMutation.mutate(data);
  };

  // Update preview when drive URL changes
  const handleDriveUrlChange = (url: string) => {
    if (url) {
      const embedUrl = convertToEmbedUrl(url);
      setPreviewUrl(embedUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg" data-testid="card-add-drive-video">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Add Video from Google Drive
          </CardTitle>
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
                      <Input
                        placeholder="Enter video title"
                        {...field}
                        disabled={createMutation.isPending}
                        data-testid="input-drive-video-title"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-drive-title" />
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
                        data-testid="input-drive-video-description"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-drive-description" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driveUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Drive Video Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://drive.google.com/file/d/..."
                        {...field}
                        disabled={createMutation.isPending}
                        onChange={(e) => {
                          field.onChange(e);
                          handleDriveUrlChange(e.target.value);
                        }}
                        data-testid="input-drive-video-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Paste your Google Drive share link. Make sure the file is set to "Anyone with the link can view"
                    </FormDescription>
                    <FormMessage data-testid="error-drive-url" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category / Subject</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={createMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-drive-video-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tutorial" data-testid="option-drive-category-tutorial">Tutorial</SelectItem>
                        <SelectItem value="Lecture" data-testid="option-drive-category-lecture">Lecture</SelectItem>
                        <SelectItem value="Demo" data-testid="option-drive-category-demo">Demo</SelectItem>
                        <SelectItem value="Review" data-testid="option-drive-category-review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-drive-category" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-add-drive-video"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Video...
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

      {/* Video Preview */}
      {previewUrl && (
        <Card className="shadow-lg" data-testid="card-drive-video-preview">
          <CardHeader>
            <CardTitle className="text-lg">Video Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-md overflow-hidden bg-muted">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Google Drive Video Preview"
                data-testid="iframe-drive-video-preview"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Preview of your Google Drive video. If the video doesn't load, make sure sharing is set to "Anyone with the link can view".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
