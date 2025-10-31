import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle, HelpCircle, Send, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Video, Comment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StudentVideoFeed() {
  const { toast } = useToast();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/like`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/comments`, { text });
      return await response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: ["/api/videos", variables.videoId, "comments"] });
      setCommentTexts(prev => ({ ...prev, [variables.videoId]: "" }));
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

  const questionMutation = useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      const response = await apiRequest("POST", "/api/questions", { videoId, text });
      return await response.json();
    },
    onSuccess: () => {
      setQuestionModalOpen(false);
      setQuestionText("");
      toast({
        title: "Success",
        description: "Question submitted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit question",
        variant: "destructive",
      });
    },
  });

  const handleLike = (videoId: string) => {
    likeMutation.mutate(videoId);
  };

  const handleCommentSubmit = (videoId: string) => {
    const text = commentTexts[videoId]?.trim();
    if (!text) return;
    commentMutation.mutate({ videoId, text });
  };

  const handleQuestionSubmit = () => {
    if (!questionText.trim()) return;
    questionMutation.mutate({ videoId: selectedVideoId, text: questionText });
  };

  const toggleComments = (videoId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const openQuestionModal = (videoId: string) => {
    setSelectedVideoId(videoId);
    setQuestionModalOpen(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-student-feed-title">
            Student Video Feed
          </h1>
          <p className="text-muted-foreground" data-testid="text-student-feed-subtitle">
            Watch tutorial videos, like, comment, and ask questions
          </p>
        </div>

        {videos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No videos available yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isCommentsExpanded={expandedComments.has(video.id)}
                commentText={commentTexts[video.id] || ""}
                onCommentTextChange={(text) => setCommentTexts(prev => ({ ...prev, [video.id]: text }))}
                onLike={() => handleLike(video.id)}
                onCommentSubmit={() => handleCommentSubmit(video.id)}
                onToggleComments={() => toggleComments(video.id)}
                onAskQuestion={() => openQuestionModal(video.id)}
                getEmbedUrl={getEmbedUrl}
                isLiking={likeMutation.isPending}
                isCommenting={commentMutation.isPending}
              />
            ))}
          </div>
        )}

        <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
          <DialogContent data-testid="dialog-ask-question">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                Submit your question about this video. The tutor will review it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                data-testid="input-question-text"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setQuestionModalOpen(false)}
                  data-testid="button-cancel-question"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuestionSubmit}
                  disabled={!questionText.trim() || questionMutation.isPending}
                  data-testid="button-submit-question"
                >
                  {questionMutation.isPending ? "Submitting..." : "Submit Question"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  isCommentsExpanded: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onLike: () => void;
  onCommentSubmit: () => void;
  onToggleComments: () => void;
  onAskQuestion: () => void;
  getEmbedUrl: (url: string) => string | null;
  isLiking: boolean;
  isCommenting: boolean;
}

function VideoCard({
  video,
  isCommentsExpanded,
  commentText,
  onCommentTextChange,
  onLike,
  onCommentSubmit,
  onToggleComments,
  onAskQuestion,
  getEmbedUrl,
  isLiking,
  isCommenting,
}: VideoCardProps) {
  const { data: comments = [], refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ["/api/videos", video.id, "comments"],
    enabled: isCommentsExpanded,
    staleTime: 0,
  });

  const embedUrl = getEmbedUrl(video.videoUrl);

  return (
    <Card className="overflow-hidden" data-testid={`card-video-${video.id}`}>
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
            <p className="text-muted-foreground">Video preview unavailable</p>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-xl text-card-foreground" data-testid={`text-video-title-${video.id}`}>
            {video.title}
          </h3>
          <Badge variant="secondary" data-testid={`badge-category-${video.id}`}>
            {video.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2" data-testid={`text-video-description-${video.id}`}>
          {video.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLike}
            disabled={isLiking}
            className="flex-1"
            data-testid={`button-like-${video.id}`}
          >
            <Heart className={`mr-2 h-4 w-4 ${video.likes > 0 ? 'fill-current' : ''}`} />
            {video.likes} {video.likes === 1 ? 'Like' : 'Likes'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleComments}
            className="flex-1"
            data-testid={`button-toggle-comments-${video.id}`}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Comments
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAskQuestion}
            className="flex-1"
            data-testid={`button-ask-question-${video.id}`}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Ask
          </Button>
        </div>

        {isCommentsExpanded && (
          <div className="space-y-3 border-t pt-4" data-testid={`section-comments-${video.id}`}>
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onCommentSubmit();
                  }
                }}
                data-testid={`input-comment-${video.id}`}
              />
              <Button
                size="icon"
                onClick={onCommentSubmit}
                disabled={!commentText.trim() || isCommenting}
                data-testid={`button-submit-comment-${video.id}`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted p-3 rounded-md"
                    data-testid={`comment-${comment.id}`}
                  >
                    <p className="text-sm">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
