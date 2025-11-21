'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Bitcoin,
  Calendar,
  ChevronLeft,
  CreditCard,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { CheckoutSessionDetail } from '@/lib/event-types';

interface EventPaymentSelectionProps {
  session: CheckoutSessionDetail;
  eventIdentifier: string;
}

export function EventPaymentSelection({
  session,
  eventIdentifier,
}: EventPaymentSelectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  const eventLink = `/events/${session.event.slug ?? session.event.id}`;
  const ticketPrice = useMemo(
    () => session.totalCents / 100,
    [session.totalCents],
  );
  const discountedPrice = useMemo(() => {
    const total = Math.max(session.totalCents - session.discountCents, 0);
    return total / 100;
  }, [session.discountCents, session.totalCents]);
  const discountValue = useMemo(
    () => Math.max(ticketPrice - discountedPrice, 0),
    [discountedPrice, ticketPrice],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('checkoutData');
    const existing = stored ? JSON.parse(stored) : {};
    sessionStorage.setItem(
      'checkoutData',
      JSON.stringify({
        ...existing,
        sessionId: session.id,
        ticketTypeId: session.ticketType.id,
        eventId: session.event.id,
      }),
    );
  }, [session]);

  const handleBCHPayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/payments/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutSessionId: session.id,
          method: 'BCH',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to start BCH payment.');
      }

      const data = await response.json();
      sessionStorage.setItem(
        'checkoutData',
        JSON.stringify({
          ...JSON.parse(sessionStorage.getItem('checkoutData') ?? '{}'),
          sessionId: data.session.id,
          paymentId: data.payment.id,
        }),
      );
      router.push(
        `/events/${eventIdentifier}/payments/sessions/${data.session.id}`,
      );
    } catch (error) {
      console.error(error);
      toast({
        title: 'Payment failed',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const handleFiatPayment = () => setShowComingSoonModal(true);

  const eventStart = session.event.startDateTime
    ? new Date(session.event.startDateTime)
    : null;
  const eventDateLabel = eventStart
    ? eventStart.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : 'Date TBA';
  const eventTimeLabel = eventStart
    ? eventStart.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Time TBA';
  const eventLocation =
    session.event.locationType === 'ONLINE'
      ? 'Online Event'
      : session.event.locationType === 'TBA'
        ? 'Location TBA'
        : session.event.venueName || 'Venue TBA';
  const eventAddress =
    session.event.locationType === 'VENUE'
      ? [session.event.addressLine1, session.event.city, session.event.country]
          .filter(Boolean)
          .join(', ')
      : session.event.onlineUrl;
  const featuredArtists =
    session.event.artists?.map((assignment) => assignment.artist?.user?.name) ??
    [];

  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="border-border bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={eventLink} className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-9">
                <ChevronLeft className="size-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
                  <span className="text-primary-foreground text-lg font-bold">
                    D
                  </span>
                </div>
                <span className="hidden text-xl font-semibold sm:inline">
                  DanceFit
                </span>
              </div>
            </Link>
            <Badge variant="outline" className="text-sm">
              Step 2 of 2
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-muted-foreground text-sm">
              Choose your payment method
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Secure Checkout
            </h1>
            <p className="text-muted-foreground mt-2">
              Complete your purchase using BCH or a credit card (coming soon).
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Payment Options</CardTitle>
                  <CardDescription>
                    Select how you want to complete the purchase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-border rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                            <Bitcoin className="text-primary size-5" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">
                              Pay with BCH
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Fast, borderless, and low-fee payments
                            </p>
                          </div>
                        </div>
                        <ul className="text-muted-foreground text-sm leading-relaxed">
                          <li>• Instant confirmation</li>
                          <li>• Exclusive BCH discounts</li>
                          <li>• Cashback rewards on select events</li>
                        </ul>
                      </div>
                      <Button
                        size="lg"
                        className="flex-shrink-0"
                        disabled={processing}
                        onClick={handleBCHPayment}
                      >
                        {processing ? 'Starting...' : 'Pay with BCH'}
                      </Button>
                    </div>
                  </div>

                  <div className="border-border rounded-xl border p-4 opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                            <CreditCard className="size-5" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">
                              Credit / Debit Card
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Pay securely with your card
                            </p>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Coming soon — get notified when fiat checkout launches
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleFiatPayment}>
                        Notify me
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-dashed">
                <CardHeader>
                  <CardTitle>Why pay with BCH?</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: 'Zero chargebacks',
                      description:
                        'Funds settle instantly, giving organizers peace of mind.',
                    },
                    {
                      title: 'Lower fees',
                      description:
                        'Save on every ticket compared to card processing fees.',
                    },
                    {
                      title: 'Global access',
                      description:
                        'Fans anywhere can purchase without banking barriers.',
                    },
                    {
                      title: 'Cashback rewards',
                      description:
                        'Unlock perks for paying with BCH on eligible events.',
                    },
                  ].map((benefit) => (
                    <div
                      key={benefit.title}
                      className="bg-muted/60 rounded-xl p-4"
                    >
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={session.event.bannerUrl || '/placeholder.svg'}
                        alt={session.event.title}
                        className="aspect-video w-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        {session.event.category && (
                          <Badge
                            variant="secondary"
                            className="mb-2 text-xs capitalize"
                          >
                            {session.event.category
                              .toLowerCase()
                              .replace(/_/g, ' ')}
                          </Badge>
                        )}
                        <h2 className="text-lg font-semibold">
                          {session.event.title}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {session.event.summary}
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Calendar className="text-muted-foreground size-4" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Date &amp; Time</p>
                          <p className="text-muted-foreground text-xs">
                            {eventDateLabel}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {eventTimeLabel}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <MapPin className="text-muted-foreground size-4" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-muted-foreground text-xs">
                            {eventLocation}
                          </p>
                          {eventAddress && (
                            <p className="text-muted-foreground text-xs">
                              {eventAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <User className="text-muted-foreground size-4" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Artists</p>
                          <p className="text-muted-foreground text-xs">
                            {featuredArtists.length
                              ? featuredArtists.join(', ')
                              : 'Lineup TBA'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Ticket Price</span>
                        <span>${ticketPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                        <span>BCH Discount</span>
                        <span>- ${discountValue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>${discountedPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-4 text-sm">
                      <p className="font-medium">Attendee</p>
                      <p>{session.attendeeName}</p>
                      <p className="text-muted-foreground">{session.attendeeEmail}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl bg-primary text-primary-foreground">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Sparkles className="size-10" />
                    <div>
                      <p className="text-lg font-semibold">Need help?</p>
                      <p className="text-primary-foreground/90 text-sm">
                        Our team is here for you — support@dancefit.com
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showComingSoonModal} onOpenChange={setShowComingSoonModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fiat checkout is coming soon</DialogTitle>
            <DialogDescription>
              Enter your email below and we&apos;ll let you know as soon as card
              payments are available.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button onClick={() => setShowComingSoonModal(false)}>
              Sounds good
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
