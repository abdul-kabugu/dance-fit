import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
  return (
    <div className="from-background via-muted/20 to-background flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <Card className="border-border/50 bg-card/95 relative z-10 w-full max-w-md shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="mx-auto h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
