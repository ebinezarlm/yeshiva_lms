import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { InsertVideo } from "@shared/schema";
import { insertVideoSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddVideoForm() {
  const { toast } = useToast();

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

  const onSubmit = (data: InsertVideo) => {
    createMutation.mutate(data);
  };

  return (
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
                    value={field.value}
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
  );
}
