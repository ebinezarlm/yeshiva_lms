import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@shared/schema";
import CommentList from "@/components/CommentList";
import LikeButton from "@/components/LikeButton";
import QuestionAnswerSection from "@/components/QuestionAnswerSection";

export default function StudentVideoFeed() {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [expandedQA, setExpandedQA] = useState<Set<string>>(new Set());

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

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

  const toggleQA = (videoId: string) => {
    setExpandedQA(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
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
      
      // Handle Google Drive URLs
      if (urlObj.hostname.includes("drive.google.com")) {
        // If it's already in embed/preview format, return as-is
        if (url.includes("/preview") || url.includes("uc?export=preview")) {
          return url;
        }
        
        // Extract FILE_ID from various Google Drive URL formats
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
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
                isQAExpanded={expandedQA.has(video.id)}
                onToggleComments={() => toggleComments(video.id)}
                onToggleQA={() => toggleQA(video.id)}
                getEmbedUrl={getEmbedUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  isCommentsExpanded: boolean;
  isQAExpanded: boolean;
  onToggleComments: () => void;
  onToggleQA: () => void;
  getEmbedUrl: (url: string) => string | null;
}

function VideoCard({
  video,
  isCommentsExpanded,
  isQAExpanded,
  onToggleComments,
  onToggleQA,
  getEmbedUrl,
}: VideoCardProps) {
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
          <LikeButton videoId={video.id} initialLikeCount={video.likes} />

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
            onClick={onToggleQA}
            className="flex-1"
            data-testid={`button-toggle-qa-${video.id}`}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Q&A
          </Button>
        </div>

        {isCommentsExpanded && (
          <div className="border-t pt-4" data-testid={`section-comments-${video.id}`}>
            <CommentList videoId={video.id} />
          </div>
        )}

        {isQAExpanded && (
          <div className="border-t pt-4" data-testid={`section-qa-${video.id}`}>
            <QuestionAnswerSection videoId={video.id} isTutor={false} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
