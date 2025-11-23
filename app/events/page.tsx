import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { EventsExplorer } from '@/components/events/events-explorer';
import { Button } from '@/components/ui/button';
import { listEvents } from '@/lib/server-api';

export default async function EventsPage() {
  const events = await listEvents({ upcoming: 'true' });

  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader />
      <EventsExplorer initialEvents={events} />
    </div>
  );
}
