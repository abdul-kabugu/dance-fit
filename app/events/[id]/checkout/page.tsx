import Link from 'next/link';

import { EventCheckoutForm } from '@/components/event-checkout-form';
import { Button } from '@/components/ui/button';
import { getEventByIdentifier } from '@/lib/server-api';

interface CheckoutPageProps {
  params: { id: string };
  searchParams: { ticket?: string };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { id } = await params;
  const { ticket } = await searchParams;
  const event = await getEventByIdentifier(id);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Button asChild className="mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EventCheckoutForm
      event={event}
      eventIdentifier={id}
      preselectedTicketId={ticket}
    />
  );
}
