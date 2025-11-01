import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaySquare, Video, MessageSquare, DollarSign } from 'lucide-react';
import type { Playlist, Video as VideoType, Question, Subscription } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';

export default function TutorDashboardPage() {
  const { user } = useAuth();

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const { data: videos = [] } = useQuery<VideoType[]>({
    queryKey: ['/api/videos'],
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const tutorEmail = user?.email || '';
  const tutorPlaylists = playlists.filter(p => p.tutorName === user?.name);
  const totalVideos = videos.length;
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
  const unansweredQuestions = questions.filter(q => !q.answer).length;
  const totalEarnings = subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);

  const stats = [
    {
      title: 'Total Playlists',
      value: tutorPlaylists.length.toString(),
      description: `${tutorPlaylists.filter(p => p.isPublic).length} public courses`,
      icon: PlaySquare,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Videos',
      value: totalVideos.toString(),
      description: `${totalLikes} total likes`,
      icon: Video,
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Comments & Q&A',
      value: questions.length.toString(),
      description: `${unansweredQuestions} pending replies`,
      icon: MessageSquare,
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings.toLocaleString()}`,
      description: 'From subscriptions',
      icon: DollarSign,
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Welcome back, {user?.name || 'Tutor'}!
        </h1>
        <p className="text-muted-foreground">
          Manage your courses and engage with students
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PlaySquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tutorPlaylists.length} playlists created</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{totalVideos} videos uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{unansweredQuestions} questions pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use the sidebar to manage your teaching content:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Upload new videos and assign to playlists</li>
              <li>• Create and manage playlists</li>
              <li>• Respond to student questions</li>
              <li>• Track your earnings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
