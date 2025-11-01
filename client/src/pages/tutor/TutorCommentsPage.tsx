import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MessageCircle, CheckCircle2, Clock, Reply } from 'lucide-react';
import { format } from 'date-fns';
import type { Question, Video } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function TutorCommentsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [replyingTo, setReplyingTo] = useState<Question | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const response = await apiRequest('POST', `/api/questions/${id}/answer`, { answer });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setReplyingTo(null);
      setReplyText('');
      toast({
        title: 'Answer posted',
        description: 'Your answer has been sent to the student',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to post answer',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const getVideoTitle = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    return video?.title || 'Unknown Video';
  };

  const filteredQuestions = questions
    .filter((q: Question) => {
      if (filter === 'answered') return q.answer !== null;
      if (filter === 'unanswered') return q.answer === null;
      return true;
    })
    .filter((q: Question) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.text.toLowerCase().includes(query) ||
        q.studentName.toLowerCase().includes(query) ||
        getVideoTitle(q.videoId).toLowerCase().includes(query)
      );
    });

  const answeredCount = questions.filter((q: Question) => q.answer !== null).length;
  const unansweredCount = questions.filter((q: Question) => q.answer === null).length;

  const handleReply = () => {
    if (!replyingTo || !replyText.trim()) return;
    answerMutation.mutate({ id: replyingTo.id, answer: replyText });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Comments & Questions</h1>
        <p className="text-muted-foreground">
          Respond to student questions and feedback
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">From all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {answeredCount}
            </div>
            <p className="text-xs text-muted-foreground">Replies sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {unansweredCount}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Questions</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                data-testid="input-search-questions"
              />
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                data-testid="button-filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === 'unanswered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unanswered')}
                data-testid="button-filter-unanswered"
              >
                Unanswered
              </Button>
              <Button
                variant={filter === 'answered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('answered')}
                data-testid="button-filter-answered"
              >
                Answered
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No student questions yet' : `No ${filter} questions`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question: Question) => (
                    <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                      <TableCell className="font-medium">
                        {question.studentName}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2">
                          {getVideoTitle(question.videoId)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-3">{question.text}</div>
                        {question.answer && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Your Reply:</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{question.answer}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(question.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={question.answer ? 'default' : 'secondary'}
                          className={question.answer ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'}
                        >
                          {question.answer ? 'Answered' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(question);
                            setReplyText(question.answer || '');
                          }}
                          data-testid={`button-reply-${question.id}`}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          {question.answer ? 'Edit' : 'Reply'}
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

      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent data-testid="dialog-reply">
          <DialogHeader>
            <DialogTitle>Reply to Question</DialogTitle>
            <DialogDescription>
              From: {replyingTo?.studentName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Student's Question:</p>
              <p className="text-sm">{replyingTo?.text}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Answer:</label>
              <Textarea
                placeholder="Type your answer here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                data-testid="textarea-reply"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || answerMutation.isPending}
              data-testid="button-send-reply"
            >
              {answerMutation.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
