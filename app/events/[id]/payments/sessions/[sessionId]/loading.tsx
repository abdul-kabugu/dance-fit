import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function BCHPaymentLoading() {
  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-b to-green-500/5">
      {/* Header */}
      <header className="border-border bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="mb-8">
            <Skeleton className="mb-2 h-9 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Payment */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="rounded-2xl border-2 border-green-500/20">
                <CardHeader className="bg-gradient-to-br from-green-500/5 to-transparent pb-6">
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="size-64 rounded-2xl" />
                    <div className="w-full space-y-2">
                      <Skeleton className="mx-auto h-3 w-32" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
