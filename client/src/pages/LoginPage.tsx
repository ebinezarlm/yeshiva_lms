import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            This is a placeholder login page. Authentication is not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              For now, you can access the platform directly through:
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/tutor">
                <Button className="w-full" variant="outline" data-testid="link-tutor-from-login">
                  Go to Tutor Dashboard
                </Button>
              </Link>
              <Link href="/student">
                <Button className="w-full" variant="outline" data-testid="link-student-from-login">
                  Go to Student Feed
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
