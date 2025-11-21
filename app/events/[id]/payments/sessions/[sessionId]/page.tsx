import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PaymentSessionTracker } from '@/components/events/payment-session-tracker';
import { Button } from '@/components/ui/button';
import { getPaymentSession } from '@/lib/server-api';

interface PaymentSessionPageProps {
  params: { id: string; sessionId: string };
}

export default async function PaymentSessionPage({
  params,
}: PaymentSessionPageProps) {
  const { id, sessionId } = await params;
  const session = await getPaymentSession(sessionId);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Payment session not found</h1>
          <p className="text-muted-foreground mt-2">
            Please restart your checkout to continue with payment.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/events/${id}/checkout`}>Restart Checkout</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (session.payment?.status === 'COMPLETED') {
    redirect(`/events/${id}/success?session=${session.id}`);
  }

  return (
    <PaymentSessionTracker
      session={session}
      eventIdentifier={id}
      sessionId={sessionId}
    />
  );
}
