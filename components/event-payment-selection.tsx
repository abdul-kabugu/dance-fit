'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Bitcoin,
  Calendar,
  ChevronLeft,
  CreditCard,
  Loader2,
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
  const DISCOUNT_PERCENT = 0.1; // 10%

  const eventLink = `/events/${session.event.slug ?? session.event.id}`;
  const ticketPrice = useMemo(
    () => session.totalCents / 100,
    [session.totalCents],
  );

  const amountSaved = useMemo(
    () => ticketPrice * DISCOUNT_PERCENT,
    [ticketPrice],
  );

  const discountedPriceO = useMemo(
    () => ticketPrice - amountSaved,
    [ticketPrice, amountSaved],
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
              Step 3 of 3
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Choose Your Payment Method
            </h1>
            <p className="text-muted-foreground mt-2">
              Select how you'd like to pay for your ticket
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Payment Options */}
            <div className="space-y-6 lg:col-span-2">
              {/* BCH Payment Option */}
              <Card
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-green-500/50 ${processing && 'border-gray-600'} shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-green-500 hover:shadow-green-500/20`}
                onClick={handleBCHPayment}
              >
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 hover:bg-green-600">
                    {processing ? (
                      <div className="flex items-center space-x-1.5">
                        <Loader2 className="h-3 w-3" />
                        <p className="text-muted-foreground">Processing</p>
                      </div>
                    ) : (
                      'Recommended'
                    )}
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-green-500/10">
                      <Bitcoin className="size-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Pay with Bitcoin Cash (BCH)
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Save 10% + earn BCH cashback via CashStamp
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-green-600">
                      ${discountedPriceO.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground line-through">
                      ${ticketPrice.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      Save ${amountSaved.toFixed(2)}
                    </Badge>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-green-500" />
                      <span>10% instant discount on your ticket</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-green-500" />
                      <span>Earn BCH cashback rewards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-green-500" />
                      <span>Fast, secure blockchain payment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-green-500" />
                      <span>No credit card fees</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Fiat Payment Option */}
              <Card
                className="group hover:border-muted-foreground/20 cursor-pointer rounded-2xl border-2 border-transparent shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                onClick={handleFiatPayment}
              >
                <CardHeader className="pb-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                      <CreditCard className="text-muted-foreground size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Pay with Google Pay / Apple Pay
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Pay instantly using your mobile wallet
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="border-border bg-background flex size-10 items-center justify-center rounded-lg border">
                        <span className="text-xs font-bold">G Pay</span>
                      </div>
                      <span className="text-muted-foreground text-sm">+</span>
                      <div className="border-border bg-background flex size-10 items-center justify-center rounded-lg border">
                        <span className="text-xs font-bold"> Pay</span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-2xl font-bold">
                        ${ticketPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                      <span>Quick checkout with saved cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                      <span>Standard ticket price</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                      <span>Widely accepted payment method</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              {/* Security Note */}
              <div className="bg-muted/50 flex items-center justify-center gap-2 rounded-xl px-6 py-4">
                <svg
                  className="size-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="text-muted-foreground text-sm">
                  All payments are secured with bank-level encryption
                </p>
              </div>
            </div>

            {/* Right Column - Event Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Event Banner */}
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={session.event.bannerUrl || '/placeholder.svg'}
                        alt={session.event.title}
                        className="aspect-video w-full object-cover"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {session.event.category}
                        </Badge>
                        <h3 className="text-lg leading-tight font-semibold text-balance">
                          {session.event.title}
                        </h3>
                      </div>

                      <Separator />

                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Date & Time</p>
                          <p className="text-muted-foreground text-xs">
                            {eventDateLabel}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {eventTimeLabel}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Location */}
                      <div className="flex items-start gap-3">
                        <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
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

                      {/* Organizer/Artist */}
                      {session.event.artists &&
                        session.event.artists.length > 0 && (
                          <>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <User className="text-muted-foreground size-4" />
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">
                                  Featured Artists
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {featuredArtists.length
                                    ? featuredArtists.join(', ')
                                    : 'Lineup TBA'}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                      <Separator />

                      {/* Ticket Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Ticket Price</span>
                          <span>${discountedPriceO.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                          <span>BCH Discount</span>
                          <span>- ${amountSaved.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>${discountedPriceO.toFixed(2)}</span>
                        </div>
                      </div>
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
