import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LikeButtonProps {
  videoId: string;
  initialLikeCount: number;
}

export default function LikeButton({ videoId, initialLikeCount }: LikeButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);

  // Clear optimistic state when new data arrives from server
  useEffect(() => {
    if (optimisticLikes !== null && optimisticLikes <= initialLikeCount) {
      setOptimisticLikes(null);
    }
  }, [initialLikeCount, optimisticLikes]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/like`);
      return await response.json();
    },
    onMutate: async () => {
      // Optimistically update the like count
      const currentLikes = optimisticLikes ?? initialLikeCount;
      setOptimisticLikes(currentLikes + 1);
    },
    onSuccess: () => {
      // Invalidate and refetch videos to get the actual count from server
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      // Don't clear optimistic state here - let it persist until new props arrive
      // This prevents visual flicker during the refetch
    },
    onError: () => {
      // Revert optimistic update on error
      setOptimisticLikes(null);
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    likeMutation.mutate();
  };

  const displayedLikes = optimisticLikes ?? initialLikeCount;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={likeMutation.isPending}
      className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
      data-testid={`button-like-${videoId}`}
    >
      <Heart 
        className={`mr-2 h-4 w-4 transition-colors duration-200 ${
          displayedLikes > 0 ? 'fill-current text-red-500' : ''
        }`} 
      />
      <span className="transition-all duration-200">
        {displayedLikes} {displayedLikes === 1 ? 'Like' : 'Likes'}
      </span>
    </Button>
  );
}
