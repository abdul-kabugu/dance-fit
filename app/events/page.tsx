import Link from 'next/link';

import { EventsExplorer } from '@/components/events/events-explorer';
import { Button } from '@/components/ui/button';
import { listEvents } from '@/lib/server-api';

export default async function EventsPage() {
  const events = await listEvents({ upcoming: 'true' });

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-lg font-bold">
                  D
                </span>
              </div>
              <span className="text-xl font-semibold">DanceFit</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <EventsExplorer initialEvents={events} />
    </div>
  );
}
