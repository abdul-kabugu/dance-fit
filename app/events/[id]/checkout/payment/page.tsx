import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EventPaymentSelection } from '@/components/event-payment-selection';
import { Button } from '@/components/ui/button';
import { getCheckoutSession } from '@/lib/server-api';

interface PaymentSelectionPageProps {
  params: { id: string };
  searchParams: { session?: string };
}

export default async function PaymentSelectionPage({
  params,
  searchParams,
}: PaymentSelectionPageProps) {
  const { id } = await params;
  const { session: sessionId } = await searchParams;
  console.log('session id', sessionId);
  if (!sessionId) {
    redirect(`/events/${id}/checkout`);
  }

  const session = await getCheckoutSession(sessionId);
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session expired</h1>
          <Button asChild className="mt-4">
            <Link href={`/events/${id}/checkout`}>Restart Checkout</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <EventPaymentSelection session={session} eventIdentifier={id} />;
}
