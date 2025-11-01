import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Subscription, Playlist } from '@shared/schema';

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.name || 'Unknown Playlist';
  };

  const filteredPayments = subscriptions.filter((sub) => {
    if (statusFilter === 'all') return true;
    return statusFilter === 'active' ? sub.status === 'active' : sub.status === 'expired';
  });

  const totalEarnings = subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);
  const pendingPayments = subscriptions.filter(s => s.status === 'active' && new Date(s.endDate) > new Date()).length;
  const failedTransactions = 0; // Mock data

  // Monthly earnings data
  const monthlyData = subscriptions.reduce((acc, sub) => {
    const month = format(new Date(sub.startDate), 'MMM yyyy');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.earnings += sub.amountPaid;
    } else {
      acc.push({ month, earnings: sub.amountPaid });
    }
    return acc;
  }, [] as { month: string; earnings: number }[]);

  const downloadInvoice = (sub: Subscription) => {
    const invoice = `
PAYMENT INVOICE

Student: ${sub.studentName}
Email: ${sub.studentEmail}
Playlist: ${getPlaylistName(sub.playlistId)}

Payment Date: ${format(new Date(sub.startDate), 'MMM dd, yyyy')}
Amount: ₹${sub.amountPaid}
Status: ${sub.status === 'active' ? 'Success' : 'Completed'}

Thank you for your payment!
    `;
    
    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-${sub.studentEmail}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      title: 'Pending Payments',
      value: pendingPayments.toString(),
      description: 'Active subscriptions',
      icon: Clock,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Successful',
      value: subscriptions.length.toString(),
      description: 'Total transactions',
      icon: CheckCircle2,
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Failed',
      value: failedTransactions.toString(),
      description: 'Failed transactions',
      icon: AlertCircle,
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Payment Management</h1>
        <p className="text-muted-foreground">
          Track and manage all payment transactions
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

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" name="Earnings (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Playlist</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.studentEmail}</TableCell>
                      <TableCell>{getPlaylistName(payment.playlistId)}</TableCell>
                      <TableCell>{format(new Date(payment.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-semibold">₹{payment.amountPaid}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        >
                          Success
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(payment)}
                          data-testid={`button-invoice-${payment.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
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
