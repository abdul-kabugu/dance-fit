import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EventCheckoutSuccess } from '@/components/event-checkout-success';
import { Button } from '@/components/ui/button';
import { getCheckoutSession } from '@/lib/server-api';

interface SuccessPageProps {
  params: { id: string };
  searchParams: { session?: string; paymentId?: string };
}

export default async function SuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { session: sessionId, paymentId } = await searchParams;
  const { id } = await params;
  if (!sessionId) {
    redirect(`/events/${id}`);
  }

  const session = await getCheckoutSession(sessionId);
  const cashbackPaymentId = paymentId ?? session?.payment?.id;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const response = await fetch(
    `${baseUrl}/api/payments/cashback/${encodeURIComponent(cashbackPaymentId!)}`,
    { cache: 'no-store' },
  );
  const cashback = await response.json();

  console.log('cashback', cashback.cashback);
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Receipt unavailable</h1>
          <p className="text-muted-foreground mt-2">
            We couldn&apos;t find the checkout session. Please return to the
            event page.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/events/${id}`}>Back to Event</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EventCheckoutSuccess
      session={session}
      eventIdentifier={id}
      paymentId={paymentId ?? session.payment?.id}
      cashbackDetails={cashback.cashback}
    />
  );
}
