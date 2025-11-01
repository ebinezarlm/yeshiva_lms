import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlaySquare, Search, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import type { Playlist, WatchProgress } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';

interface PlaylistWithProgress extends Playlist {
  progress: number;
  watchedVideos: number;
}

export default function StudentPlaylistsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const { data: watchProgress = [] } = useQuery<WatchProgress[]>({
    queryKey: ['/api/watch-progress/student', user?.email],
    enabled: !!user?.email,
  });

  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ['/api/subscriptions/student', user?.email],
    enabled: !!user?.email,
  });

  const subscribedPlaylistIds = subscriptions.map((sub: any) => sub.playlistId);

  const subscribedPlaylists: PlaylistWithProgress[] = playlists
    .filter(playlist => subscribedPlaylistIds.includes(playlist.id))
    .map(playlist => {
      const playlistProgress = watchProgress.filter(p => p.playlistId === playlist.id);
      const watchedVideos = playlistProgress.filter(p => p.completed === 1).length;
      const totalVideos = playlist.videoCount || 0;
      const progress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

      return {
        ...playlist,
        progress,
        watchedVideos,
      };
    })
    .filter(playlist => 
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">My Playlists</h1>
          <p className="text-muted-foreground">
            {subscribedPlaylists.length} playlist{subscribedPlaylists.length !== 1 ? 's' : ''} subscribed
          </p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-playlists"
          />
        </div>
      </div>

      {subscribedPlaylists.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No playlists found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Subscribe to playlists to get started'}
              </p>
            </div>
            {!searchQuery && (
              <Link href="/student/explore">
                <Button data-testid="button-explore-courses">Explore Courses</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscribedPlaylists.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden hover-elevate" data-testid={`card-playlist-${playlist.id}`}>
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlaySquare className="h-16 w-16 text-white/80" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    {playlist.videoCount || 0} videos
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <h3 className="font-semibold line-clamp-1" data-testid={`text-playlist-title-${playlist.id}`}>
                    {playlist.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>By {playlist.tutorName}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {playlist.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{playlist.progress}%</span>
                  </div>
                  <Progress value={playlist.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {playlist.watchedVideos} of {playlist.videoCount || 0} videos completed
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/student/playlist/${playlist.id}`} className="w-full">
                  <Button className="w-full" data-testid={`button-view-playlist-${playlist.id}`}>
                    View Playlist
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
