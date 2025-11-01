import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { insertQuestionSchema, type Question, type Video } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const questionFormSchema = insertQuestionSchema;

type QuestionFormData = z.infer<typeof questionFormSchema>;

export default function StudentQnaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [showNewQuestion, setShowNewQuestion] = useState(false);

  const { data: studentQuestions = [] } = useQuery<Question[]>({
    queryKey: ['/api/questions/student', user?.email],
    enabled: !!user?.email,
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      videoId: '',
      studentEmail: user?.email || '',
      studentName: user?.name || '',
      text: '',
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest('POST', '/api/questions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions/student', user?.email] });
      setShowNewQuestion(false);
      form.reset({
        videoId: '',
        studentEmail: user?.email || '',
        studentName: user?.name || '',
        text: '',
      });
      toast({
        title: 'Question posted',
        description: 'Your question has been submitted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to post question',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const getVideoTitle = (videoId: string) => {
    const video = videos.find((v: Video) => v.id === videoId);
    return video?.title || 'Unknown Video';
  };

  const filteredQuestions = studentQuestions.filter((q: Question) => {
    if (filter === 'answered') return q.answer !== null;
    if (filter === 'unanswered') return q.answer === null;
    return true;
  });

  const answeredCount = studentQuestions.filter((q: Question) => q.answer !== null).length;
  const unansweredCount = studentQuestions.filter((q: Question) => q.answer === null).length;

  const handleOpenDialog = () => {
    form.reset({
      videoId: '',
      studentEmail: user?.email || '',
      studentName: user?.name || '',
      text: '',
    });
    setShowNewQuestion(true);
  };

  const handleSubmit = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Comments & Q&A</h1>
          <p className="text-muted-foreground">
            View your questions and get answers from tutors
          </p>
        </div>
        <Button onClick={handleOpenDialog} data-testid="button-new-question">
          <Plus className="h-4 w-4 mr-2" />
          Ask Question
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentQuestions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
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
            <p className="text-xs text-muted-foreground">Received answers</p>
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
            <p className="text-xs text-muted-foreground">Waiting for answer</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Questions</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                data-testid="button-filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === 'answered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('answered')}
                data-testid="button-filter-answered"
              >
                Answered
              </Button>
              <Button
                variant={filter === 'unanswered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unanswered')}
                data-testid="button-filter-unanswered"
              >
                Unanswered
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Ask a question to get started'
                  : `No ${filter} questions`}
              </p>
              {filter === 'all' && (
                <Button onClick={handleOpenDialog}>
                  Ask Your First Question
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Tutor Reply</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question: Question) => (
                    <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="line-clamp-2">
                          {getVideoTitle(question.videoId)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-3">{question.text}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {question.answer ? (
                          <div className="space-y-1">
                            <div className="line-clamp-3">{question.answer}</div>
                            {question.answeredAt && (
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(question.answeredAt), 'PP')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No answer yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(question.createdAt), 'PP')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={question.answer ? 'default' : 'secondary'}
                          className={question.answer ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'}
                        >
                          {question.answer ? 'Answered' : 'Pending'}
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

      <Dialog open={showNewQuestion} onOpenChange={setShowNewQuestion}>
        <DialogContent data-testid="dialog-new-question">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>
              Select a video and ask your question
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="videoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Video</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-video">
                          <SelectValue placeholder="Choose a video" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {videos.map((video: Video) => (
                          <SelectItem key={video.id} value={video.id}>
                            {video.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Question</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Type your question here..."
                        rows={5}
                        data-testid="textarea-question"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewQuestion(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                  data-testid="button-submit-question"
                >
                  {createQuestionMutation.isPending ? 'Posting...' : 'Post Question'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
