import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import TutorDashboard from "@/pages/TutorDashboard";
import StudentVideoFeed from "@/pages/StudentVideoFeed";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex gap-4">
            <Link href="/tutor">
              <Button
                variant={location === "/tutor" ? "default" : "ghost"}
                data-testid="link-tutor-dashboard"
              >
                Tutor Dashboard
              </Button>
            </Link>
            <Link href="/student">
              <Button
                variant={location === "/student" ? "default" : "ghost"}
                data-testid="link-student-feed"
              >
                Student Feed
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={TutorDashboard} />
        <Route path="/tutor" component={TutorDashboard} />
        <Route path="/student" component={StudentVideoFeed} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
