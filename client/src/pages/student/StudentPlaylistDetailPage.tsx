import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Play, ThumbsUp, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { Playlist, Video, WatchProgress } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import CommentList from '@/components/CommentList';
import QuestionAnswerSection from '@/components/QuestionAnswerSection';

export default function StudentPlaylistDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'qa'>('comments');

  const { data: playlist } = useQuery<Playlist>({
    queryKey: ['/api/playlists', id],
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  const { data: watchProgress = [] } = useQuery<WatchProgress[]>({
    queryKey: ['/api/watch-progress/student', user?.email, 'playlist', id],
    enabled: !!user?.email && !!id,
  });

  const playlistVideos = videos.filter(v => v.playlistId === id);

  const markAsWatchedMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest('POST', '/api/watch-progress', {
        studentEmail: user?.email,
        videoId,
        playlistId: id,
        progress: 100,
        completed: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watch-progress/student'] });
      toast({
        title: 'Progress saved',
        description: 'Video marked as watched',
      });
    },
  });

  const likeVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest('POST', `/api/videos/${videoId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: 'Video liked',
      });
    },
  });

  const getVideoUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()?.split('?')[0]
        : new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    if (url.includes('drive.google.com')) {
      return url;
    }
    return url;
  };

  const isVideoWatched = (videoId: string) => {
    return watchProgress.some(p => p.videoId === videoId && p.completed === 1);
  };

  const watchedCount = playlistVideos.filter(v => isVideoWatched(v.id)).length;
  const progressPercent = playlistVideos.length > 0 
    ? Math.round((watchedCount / playlistVideos.length) * 100) 
    : 0;

  if (!playlist) {
    return (
      <div className="space-y-6">
        <Link href="/student/playlists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Playlists
          </Button>
        </Link>
        <Card className="p-12">
          <p className="text-center text-muted-foreground">Loading playlist...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/student/playlists">
        <Button variant="ghost" size="sm" data-testid="button-back-to-playlists">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Playlists
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-2xl" data-testid="text-playlist-title">{playlist.name}</CardTitle>
              <CardDescription className="text-base">
                By {playlist.tutorName} • {playlist.category}
              </CardDescription>
              {playlist.description && (
                <p className="text-sm text-muted-foreground">{playlist.description}</p>
              )}
            </div>
            <Badge variant="secondary">
              {playlistVideos.length} videos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {watchedCount} of {playlistVideos.length} completed
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground">{progressPercent}% complete</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Videos</h2>
        <div className="space-y-3">
          {playlistVideos.map((video, index) => {
            const watched = isVideoWatched(video.id);
            
            return (
              <Card key={video.id} className="hover-elevate" data-testid={`card-video-${video.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-32 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white/80" />
                      </div>
                      {watched && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="h-5 w-5 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold line-clamp-1" data-testid={`text-video-title-${video.id}`}>
                            {index + 1}. {video.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {video.duration || '5:30'}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {video.likes}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {watched && (
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              Completed
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setSelectedVideo(video)}
                            data-testid={`button-watch-${video.id}`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Watch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedVideo && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-video-modal-title">{selectedVideo.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <iframe
                    src={getVideoUrl(selectedVideo.videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="iframe-video-player"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likeVideoMutation.mutate(selectedVideo.id)}
                    disabled={likeVideoMutation.isPending}
                    data-testid="button-like-video"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Like ({selectedVideo.likes})
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsWatchedMutation.mutate(selectedVideo.id)}
                    disabled={markAsWatchedMutation.isPending || isVideoWatched(selectedVideo.id)}
                    data-testid="button-mark-watched"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {isVideoWatched(selectedVideo.id) ? 'Completed' : 'Mark as Watched'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 border-b">
                    <Button
                      variant={activeTab === 'comments' ? 'secondary' : 'ghost'}
                      onClick={() => setActiveTab('comments')}
                      data-testid="button-tab-comments"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comments
                    </Button>
                    <Button
                      variant={activeTab === 'qa' ? 'secondary' : 'ghost'}
                      onClick={() => setActiveTab('qa')}
                      data-testid="button-tab-qa"
                    >
                      Q&A
                    </Button>
                  </div>

                  {activeTab === 'comments' && (
                    <CommentList videoId={selectedVideo.id} />
                  )}
                  
                  {activeTab === 'qa' && (
                    <QuestionAnswerSection videoId={selectedVideo.id} />
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
