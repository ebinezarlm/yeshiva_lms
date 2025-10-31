import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Question } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface QuestionAnswerSectionProps {
  videoId: string;
  isTutor?: boolean;
}

export default function QuestionAnswerSection({ videoId, isTutor = false }: QuestionAnswerSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/videos", videoId, "questions"],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/questions`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
    staleTime: 0,
  });

  const askQuestionMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/questions", { videoId, text });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/videos", videoId, "questions"] });
      setQuestionText("");
      toast({
        title: "Success",
        description: "Question posted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post question",
        variant: "destructive",
      });
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const response = await apiRequest("POST", `/api/questions/${questionId}/answer`, { answer });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({ queryKey: ["/api/videos", videoId, "questions"] });
      setAnswerText(prev => {
        const newState = { ...prev };
        delete newState[variables.questionId];
        return newState;
      });
      toast({
        title: "Success",
        description: "Answer posted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post answer",
        variant: "destructive",
      });
    },
  });

  const handleAskQuestion = () => {
    if (!questionText.trim()) return;
    askQuestionMutation.mutate(questionText);
  };

  const handleAnswerQuestion = (questionId: string) => {
    const answer = answerText[questionId];
    if (!answer?.trim()) return;
    answerQuestionMutation.mutate({ questionId, answer });
  };

  const toggleQuestion = (questionId: string, open: boolean) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(questionId);
      } else {
        newSet.delete(questionId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" />
          <span>Questions & Answers</span>
        </div>
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>Questions & Answers</span>
      </div>

      {/* Ask Question Form (visible to all) */}
      <div className="space-y-2">
        <Textarea
          placeholder="Ask a question about this video..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="resize-none"
          rows={3}
          data-testid={`input-question-text-${videoId}`}
        />
        <Button
          onClick={handleAskQuestion}
          disabled={askQuestionMutation.isPending || !questionText.trim()}
          size="sm"
          data-testid={`button-submit-question-${videoId}`}
        >
          {askQuestionMutation.isPending ? "Posting..." : "Post Question"}
        </Button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions yet. Be the first to ask!
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            
            return (
              <div
                key={question.id}
                className="border rounded-md p-4"
                data-testid={`card-question-${question.id}`}
              >
                <Collapsible
                  open={isExpanded}
                  onOpenChange={(open) => toggleQuestion(question.id, open)}
                >
                  <CollapsibleTrigger asChild>
                    <button 
                      className="w-full flex items-start justify-between gap-2 text-left hover-elevate active-elevate-2 p-2 rounded-md transition-all"
                      data-testid={`button-toggle-question-${question.id}`}
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{question.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 mt-1" />
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-3">
                    <div className="space-y-3">
                      {question.answer ? (
                        <div
                          className="bg-muted/50 rounded-md p-3 space-y-2"
                          data-testid={`section-answer-${question.id}`}
                        >
                          <p className="text-xs font-semibold text-primary">Answer:</p>
                          <p className="text-sm">{question.answer}</p>
                          {question.answeredAt && (
                            <p className="text-xs text-muted-foreground">
                              Answered {formatDistanceToNow(new Date(question.answeredAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      ) : (
                        isTutor && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">No answer yet</p>
                            <Textarea
                              placeholder="Type your answer..."
                              value={answerText[question.id] || ""}
                              onChange={(e) =>
                                setAnswerText(prev => ({ ...prev, [question.id]: e.target.value }))
                              }
                              className="resize-none"
                              rows={3}
                              data-testid={`input-answer-text-${question.id}`}
                            />
                            <Button
                              onClick={() => handleAnswerQuestion(question.id)}
                              disabled={answerQuestionMutation.isPending || !answerText[question.id]?.trim()}
                              size="sm"
                              data-testid={`button-submit-answer-${question.id}`}
                            >
                              {answerQuestionMutation.isPending ? "Posting..." : "Post Answer"}
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
