import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlaySquare, Search, Filter } from 'lucide-react';
import type { Playlist } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function StudentExploreCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [subscribePlaylist, setSubscribePlaylist] = useState<Playlist | null>(null);
  const [subscriptionMonths, setSubscriptionMonths] = useState('3');

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ['/api/subscriptions/student', user?.email],
    enabled: !!user?.email,
  });

  const subscribedPlaylistIds = subscriptions.map((sub: any) => sub.playlistId);

  const categories = Array.from(new Set(playlists.map(p => p.category))).filter(Boolean);

  const filteredPlaylists = playlists
    .filter(p => p.isPublic === 1)
    .filter(p => 
      !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const subscribeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/subscriptions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/student'] });
      setSubscribePlaylist(null);
      toast({
        title: 'Subscription successful!',
        description: 'You now have access to this playlist',
      });
    },
    onError: () => {
      toast({
        title: 'Subscription failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const handleSubscribe = () => {
    if (!subscribePlaylist || !user) return;

    const months = parseInt(subscriptionMonths);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const amountPaid = months * 500; // ₹500 per month

    subscribeMutation.mutate({
      studentEmail: user.email,
      studentName: user.name,
      playlistId: subscribePlaylist.id,
      startDate: new Date(),
      endDate,
      status: 'active',
      amountPaid,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Explore Courses</h1>
        <p className="text-muted-foreground">
          Discover and subscribe to new learning content
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses or tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-courses"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40" data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Most Viewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPlaylists.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <PlaySquare className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaylists.map((playlist) => {
            const isSubscribed = subscribedPlaylistIds.includes(playlist.id);

            return (
              <Card key={playlist.id} className="overflow-hidden hover-elevate" data-testid={`card-course-${playlist.id}`}>
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
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-1" data-testid={`text-course-title-${playlist.id}`}>
                      {playlist.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">By {playlist.tutorName}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {playlist.category}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{playlist.viewCount || 0} views</span>
                  </div>
                </CardContent>

                <CardFooter>
                  {isSubscribed ? (
                    <Badge variant="secondary" className="w-full justify-center">
                      Subscribed
                    </Badge>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setSubscribePlaylist(playlist)}
                      data-testid={`button-subscribe-${playlist.id}`}
                    >
                      Subscribe
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!subscribePlaylist} onOpenChange={() => setSubscribePlaylist(null)}>
        <DialogContent data-testid="dialog-subscribe">
          <DialogHeader>
            <DialogTitle>Subscribe to {subscribePlaylist?.name}</DialogTitle>
            <DialogDescription>
              Choose your subscription plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subscription Duration</Label>
              <Select value={subscriptionMonths} onValueChange={setSubscriptionMonths}>
                <SelectTrigger data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month - ₹500</SelectItem>
                  <SelectItem value="3">3 Months - ₹1,500</SelectItem>
                  <SelectItem value="6">6 Months - ₹3,000</SelectItem>
                  <SelectItem value="12">12 Months - ₹6,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">{subscribePlaylist?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tutor:</span>
                <span>{subscribePlaylist?.tutorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Videos:</span>
                <span>{subscribePlaylist?.videoCount || 0}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>₹{parseInt(subscriptionMonths) * 500}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscribePlaylist(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
              data-testid="button-confirm-subscribe"
            >
              {subscribeMutation.isPending ? 'Processing...' : 'Confirm & Subscribe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
