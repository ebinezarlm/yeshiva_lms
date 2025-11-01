import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, PlaySquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription, Playlist } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';

export default function TutorEarningsPage() {
  const { user } = useAuth();

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const tutorPlaylists = playlists.filter(p => p.tutorName === user?.name);
  const tutorPlaylistIds = tutorPlaylists.map(p => p.id);
  const tutorSubscriptions = subscriptions.filter(s => tutorPlaylistIds.includes(s.playlistId));

  const totalEarnings = tutorSubscriptions.reduce((sum, s) => sum + s.amountPaid, 0);
  const activeSubscriptions = tutorSubscriptions.filter(s => s.status === 'active');
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthlyEarnings = tutorSubscriptions
    .filter(s => new Date(s.createdAt) >= thisMonth)
    .reduce((sum, s) => sum + s.amountPaid, 0);

  const earningsByPlaylist = tutorPlaylists.map(playlist => {
    const playlistSubs = tutorSubscriptions.filter(s => s.playlistId === playlist.id);
    const earnings = playlistSubs.reduce((sum, s) => sum + s.amountPaid, 0);
    const subscribers = playlistSubs.length;
    const latestSub = playlistSubs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      playlist,
      earnings,
      subscribers,
      lastPayment: latestSub ? new Date(latestSub.createdAt) : null,
    };
  });

  const stats = [
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings.toLocaleString()}`,
      description: 'All time revenue',
      icon: DollarSign,
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'This Month',
      value: `₹${monthlyEarnings.toLocaleString()}`,
      description: 'Current month earnings',
      icon: TrendingUp,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Subscribers',
      value: activeSubscriptions.length.toString(),
      description: 'Currently enrolled',
      icon: Users,
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Earning Playlists',
      value: earningsByPlaylist.filter(e => e.subscribers > 0).length.toString(),
      description: `Out of ${tutorPlaylists.length} total`,
      icon: PlaySquare,
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Earnings Summary</h1>
        <p className="text-muted-foreground">
          Track your revenue from course subscriptions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings by Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          {earningsByPlaylist.length === 0 ? (
            <div className="text-center py-12">
              <PlaySquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground">Create playlists to start earning</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Playlist</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsByPlaylist.map(({ playlist, earnings, subscribers, lastPayment }) => (
                    <TableRow key={playlist.id} data-testid={`row-earnings-${playlist.id}`}>
                      <TableCell className="font-medium">{playlist.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{playlist.category}</Badge>
                      </TableCell>
                      <TableCell>{subscribers}</TableCell>
                      <TableCell className="font-semibold">₹{earnings.toLocaleString()}</TableCell>
                      <TableCell>
                        {lastPayment ? format(lastPayment, 'MMM d, yyyy') : 'No payments'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={subscribers > 0 ? 'default' : 'secondary'}
                          className={subscribers > 0 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}
                        >
                          {subscribers > 0 ? 'Active' : 'No Subscribers'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
