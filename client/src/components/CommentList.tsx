import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface CommentListProps {
  videoId: string;
}

export default function CommentList({ videoId }: CommentListProps) {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [username, setUsername] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/videos", videoId, "comments"],
    staleTime: 0,
  });

  const commentMutation = useMutation({
    mutationFn: async ({ text, username }: { text: string; username: string }) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/comments`, { 
        videoId, 
        text,
        username: username || "Anonymous"
      });
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/videos", videoId, "comments"] });
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    commentMutation.mutate({ text, username });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4" data-testid={`comment-list-${videoId}`}>
      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Your name (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1"
            data-testid={`input-username-${videoId}`}
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={commentMutation.isPending}
            className="flex-1"
            data-testid={`input-comment-${videoId}`}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!commentText.trim() || commentMutation.isPending}
            data-testid={`button-submit-comment-${videoId}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid={`text-no-comments-${videoId}`}>
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border bg-card p-3 space-y-1"
              data-testid={`comment-item-${comment.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" data-testid={`comment-username-${comment.id}`}>
                  {comment.username}
                </span>
                <span className="text-xs text-muted-foreground" data-testid={`comment-timestamp-${comment.id}`}>
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground" data-testid={`comment-text-${comment.id}`}>
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
