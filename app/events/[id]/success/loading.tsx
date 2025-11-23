import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="via-background to-background min-h-screen bg-gradient-to-b from-green-50/30 dark:from-green-950/10">
      {/* Header Skeleton */}
      <header className="border-border bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="hidden h-6 w-24 sm:block" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Success Header Skeleton */}
          <div className="mb-12 text-center">
            <Skeleton className="mx-auto mb-6 size-20 rounded-full" />
            <Skeleton className="mx-auto mb-3 h-10 w-80" />
            <Skeleton className="mx-auto h-6 w-64" />
          </div>

          <div className="space-y-6">
            {/* Ticket Card Skeleton */}
            <Card className="overflow-hidden rounded-2xl border-2">
              <CardHeader className="bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-6" />
                    <Skeleton className="h-7 w-32" />
                  </div>
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                  <div>
                    <Skeleton className="mb-2 h-4 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div>
                    <Skeleton className="mb-2 h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div>
                    <Skeleton className="mb-2 h-4 w-28" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                  <div className="sm:col-span-2">
                    <Skeleton className="mb-2 h-4 w-12" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <div className="sm:col-span-2">
                    <Skeleton className="mb-2 h-4 w-20" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
                <div className="bg-border my-4 h-px" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* NFT Delivery Card Skeleton */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-6 w-64" />
                </div>
                <Skeleton className="mt-2 h-4 w-80" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Skeleton className="size-48 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <Skeleton className="mb-2 h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Cashback Card Skeleton */}
            <Card className="overflow-hidden rounded-2xl border-2">
              <CardHeader className="bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-6 w-56" />
                </div>
                <Skeleton className="mt-2 h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <Skeleton className="size-48 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <Skeleton className="mx-auto mb-2 h-4 w-32 sm:mx-0" />
                      <Skeleton className="mx-auto h-9 w-40 sm:mx-0" />
                      <Skeleton className="mx-auto mt-2 h-4 w-24 sm:mx-0" />
                    </div>
                    <Skeleton className="mx-auto h-10 w-full sm:mx-0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Summary Card Skeleton */}
            <Card className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="space-y-3">
                  <div>
                    <Skeleton className="mb-2 h-5 w-20" />
                    <Skeleton className="h-6 w-64" />
                  </div>
                  <div className="bg-border my-3 h-px" />
                  <div className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 size-4 shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <div className="bg-border my-3 h-px" />
                  <div className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 size-4 shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="bg-border my-3 h-px" />
                  <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="bg-border my-2 h-px" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Section Card Skeleton */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="mt-2 h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row">
              <Skeleton className="h-11 flex-1 rounded-lg" />
              <Skeleton className="h-11 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
