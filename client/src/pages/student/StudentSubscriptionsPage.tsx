import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw, CreditCard, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Subscription, Playlist } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function StudentSubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions/student', user?.email],
    enabled: !!user?.email,
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const getTutorName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.tutorName || 'Unknown Tutor';
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');
  const totalSpent = subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);

  const handleDownloadInvoice = (subscription: Subscription) => {
    const invoiceData = `
LEARNING MANAGEMENT SYSTEM
INVOICE

Student: ${subscription.studentName}
Email: ${subscription.studentEmail}

Course: ${getPlaylistName(subscription.playlistId)}
Tutor: ${getTutorName(subscription.playlistId)}

Start Date: ${format(new Date(subscription.startDate), 'PP')}
End Date: ${format(new Date(subscription.endDate), 'PP')}
Status: ${subscription.status}

Amount Paid: ₹${subscription.amountPaid}

Thank you for your subscription!
    `.trim();

    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${subscription.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Invoice downloaded',
      description: 'Your invoice has been downloaded successfully',
    });
  };

  const handleRenew = () => {
    toast({
      title: 'Renewal coming soon',
      description: 'This feature will be available soon',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your course subscriptions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeSubscriptions.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Subscriptions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {expiredSubscriptions.length}
            </div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to courses to start learning
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Playlist</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => {
                    const daysRemaining = differenceInDays(new Date(subscription.endDate), new Date());
                    const isActive = subscription.status === 'active';

                    return (
                      <TableRow key={subscription.id} data-testid={`row-subscription-${subscription.id}`}>
                        <TableCell className="font-medium">
                          {getPlaylistName(subscription.playlistId)}
                        </TableCell>
                        <TableCell>{getTutorName(subscription.playlistId)}</TableCell>
                        <TableCell>{format(new Date(subscription.startDate), 'PP')}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{format(new Date(subscription.endDate), 'PP')}</div>
                            {isActive && daysRemaining > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {daysRemaining} days remaining
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isActive ? 'default' : 'secondary'}
                            className={isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}
                          >
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{subscription.amountPaid}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(subscription)}
                              data-testid={`button-download-invoice-${subscription.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                            {!isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRenew}
                                data-testid={`button-renew-${subscription.id}`}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Renew
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
