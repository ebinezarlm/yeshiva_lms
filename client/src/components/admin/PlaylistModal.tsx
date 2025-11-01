import { X, PlayCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Video {
  id: number;
  title: string;
  duration: string;
}

interface User {
  id: number;
  name: string;
  playlist: string;
  dueDate: string;
  videos: Video[];
  progress: number;
  status: string;
}

interface PlaylistModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistModal({ user, isOpen, onClose }: PlaylistModalProps) {
  const subscriptionDuration = () => {
    const due = new Date(user.dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return "Expires today";
    } else {
      return `${diffDays} days remaining`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="modal-playlist-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            {user.playlist}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Student</h3>
                <p className="text-base font-medium" data-testid="text-modal-user-name">{user.name}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-medium text-muted-foreground">Subscription Status</h3>
                <Badge
                  variant={user.status === "Active" ? "default" : "secondary"}
                  className={
                    user.status === "Active"
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  }
                  data-testid="badge-modal-status"
                >
                  {user.status}
                </Badge>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Course Progress</span>
                <span className="text-sm font-medium text-primary" data-testid="text-progress-percentage">
                  {user.progress}%
                </span>
              </div>
              <Progress value={user.progress} className="h-2" data-testid="progress-bar" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Duration</span>
                </div>
                <p className="text-sm font-medium" data-testid="text-subscription-duration">
                  {subscriptionDuration()}
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <PlayCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Videos</span>
                </div>
                <p className="text-sm font-medium" data-testid="text-total-videos">
                  {user.videos.length} videos
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Course Content</h3>
            <ScrollArea className="h-72 rounded-md border">
              <div className="p-4 space-y-3">
                {user.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`video-item-${video.id}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1" data-testid={`text-video-title-${video.id}`}>
                        {video.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span data-testid={`text-video-duration-${video.id}`}>{video.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
