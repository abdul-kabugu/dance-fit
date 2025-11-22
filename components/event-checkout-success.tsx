'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Calendar,
  CheckCircle2,
  Coins,
  Copy,
  MapPin,
  QrCode,
  Share2,
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { CheckoutSessionDetail } from '@/lib/event-types';

type CashbackPayload = {
  id: string;
  amountSats: number;
  bchAddress: string;
  wifEncrypted: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

interface EventCheckoutSuccessProps {
  session: CheckoutSessionDetail;
  eventIdentifier: string;
  paymentId?: string | null;
}

export function EventCheckoutSuccess({
  session,
  eventIdentifier,
  paymentId,
}: EventCheckoutSuccessProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copiedTokenId, setCopiedTokenId] = useState(false);
  const [copiedEventLink, setCopiedEventLink] = useState(false);

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    import('canvas-confetti').then((confetti) => {
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        confetti.default({
          ...defaults,
          particleCount: 50 * (timeLeft / duration),
          origin: { x: Math.random() * 0.5, y: Math.random() - 0.2 },
        });
        confetti.default({
          ...defaults,
          particleCount: 50 * (timeLeft / duration),
          origin: { x: 0.5 + Math.random() * 0.5, y: Math.random() - 0.2 },
        });
      }, 250);
    });
  }, []);

  const ticket = session.payment?.ticket;
  const nftTokenId = ticket?.nftTicket?.tokenId;
  const [cashbackDetails, setCashbackDetails] = useState<CashbackPayload | null>(
    null,
  );
  const [cashbackError, setCashbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setCashbackDetails(null);
      setCashbackError(null);
      return;
    }
    let cancelled = false;
    const fetchCashback = async () => {
      try {
        setCashbackError(null);
        const response = await fetch(
          `/api/payments/cashback/${encodeURIComponent(paymentId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) setCashbackDetails(null);
            return;
          }
          throw new Error('Failed to load cashback details.');
        }
        const data = await response.json();
        if (!cancelled) {
          setCashbackDetails(data.cashback);
        }
      } catch (error) {
        if (cancelled) return;
        setCashbackError(
          error instanceof Error
            ? error.message
            : 'Unable to load cashback.',
        );
      }
    };
    fetchCashback();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const fallbackCashback = session.payment?.cashback ?? null;
  const cashbackAmount =
    cashbackDetails?.amountSats ?? fallbackCashback?.amountSats ?? null;
  const event = session.event;
  const eventDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBA';
  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Time TBA';
  const eventLocation =
    event.locationType === 'ONLINE'
      ? 'Online Event'
      : event.locationType === 'TBA'
        ? 'Location TBA'
        : event.venueName || 'Venue TBA';
  const addressLine =
    event.locationType === 'VENUE'
      ? [event.addressLine1, event.city, event.country]
          .filter(Boolean)
          .join(', ')
      : event.onlineUrl;
  const featuredArtists = useMemo(
    () =>
      event.artists?.map((assignment) => assignment.artist?.user?.name).filter(Boolean) ??
      [],
    [event.artists],
  );

  const eventLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${event.slug ?? event.id}`;

  const handleCopy = async (value: string, setter: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setter(true);
      toast({ title: 'Copied!', description: 'Copied to clipboard.' });
      setTimeout(() => setter(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToEvent = () => {
    router.push(`/events/${event.slug ?? event.id}`);
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="border-border bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/events/${eventIdentifier}`}
              className="flex items-center gap-2"
            >
              <div className="bg-primary flex size-10 items-center justify-center rounded-full text-primary-foreground">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Order confirmed
                </p>
                <p className="text-foreground font-semibold">
                  #{ticket?.referenceCode ?? 'DF-ORDER'}
                </p>
              </div>
            </Link>
            <Badge variant="outline" className="text-sm">
              Ticket ready
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">
            You&apos;re all set!
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Your ticket is confirmed. Keep the QR code below handy for entry.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="text-base">
                    {event.summary}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {session.ticketType.name ?? 'Admission'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-primary mt-1 size-5" />
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Date &amp; Time
                      </p>
                      <p className="text-lg font-semibold">{formattedDate}</p>
                      <p className="text-muted-foreground">{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary mt-1 size-5" />
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Location
                      </p>
                      <p className="text-lg font-semibold">{eventLocation}</p>
                      {addressLine && (
                        <p className="text-muted-foreground">{addressLine}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Ticket Holder
                    </p>
                    <p className="text-xl font-semibold">
                      {session.attendeeName}
                    </p>
                    <p className="text-muted-foreground">
                      {session.attendeeEmail}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Ticket Reference
                    </p>
                    <p className="text-xl font-semibold">
                      {ticket?.referenceCode ?? 'Pending'}
                    </p>
                    <p className="text-muted-foreground">
                      Show this code at the entrance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Your QR Ticket</CardTitle>
                  <CardDescription>
                    Present this code at the entrance to check in.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => handleCopy(eventLink, setCopiedEventLink)}
                >
                  <Share2 className="size-4" />
                  {copiedEventLink ? 'Copied' : 'Share Event'}
                </Button>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="flex flex-col items-center gap-4 rounded-2xl border p-6">
                  <div className="bg-muted flex size-48 items-center justify-center rounded-2xl">
                    <QrCode className="size-40 text-muted-foreground" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    We&apos;ve emailed you a scannable QR code as well
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-muted/60 p-5">
                    <p className="text-sm font-semibold text-muted-foreground">
                      NFT Ticket
                    </p>
                    <p className="text-2xl font-semibold">
                      {nftTokenId ? `Token #${nftTokenId}` : 'Mint pending'}
                    </p>
                    {nftTokenId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => handleCopy(nftTokenId, setCopiedTokenId)}
                      >
                        <Copy className="mr-2 size-4" />
                        {copiedTokenId ? 'Copied!' : 'Copy Token ID'}
                      </Button>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        We&apos;ll notify you when your NFT ticket is minted.
                      </p>
                    )}
                  </div>
                  {cashbackAmount ? (
                    <div className="rounded-2xl bg-primary/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary flex size-12 items-center justify-center rounded-full text-primary-foreground">
                          <Coins className="size-6" />
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">
                              Cashback Earned
                            </p>
                            <p className="text-2xl font-semibold">
                              {(cashbackAmount / 1e8).toFixed(4)} BCH
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {cashbackDetails?.status
                                ? `Status: ${cashbackDetails.status}`
                                : 'Use your cashback in future events'}
                            </p>
                          </div>
                          {cashbackDetails ? (
                            <div className="rounded-xl bg-white/70 p-3 text-xs font-mono text-muted-foreground">
                              <div>
                                <span className="font-semibold">Address:</span>{' '}
                                <span className="break-all">
                                  {cashbackDetails.bchAddress}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="font-semibold">WIF:</span>{' '}
                                <span className="break-all">
                                  {cashbackDetails.wifEncrypted}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="font-semibold">Updated:</span>{' '}
                                {new Date(cashbackDetails.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          ) : cashbackError ? (
                            <p className="text-destructive text-xs">
                              {cashbackError}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : cashbackError ? (
                    <p className="text-destructive text-xs">
                      {cashbackError}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {featuredArtists.length > 0 && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Featured Artists</CardTitle>
                  <CardDescription>
                    Meet the artists performing at this event.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {featuredArtists.map((name) => (
                    <div
                      key={name}
                      className="rounded-2xl border p-4 text-sm font-medium"
                    >
                      {name}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Order Summary
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Ticket</span>
                      <span>
                        {session.ticketType.priceCents === 0
                          ? 'Free'
                          : `$${(session.ticketType.priceCents / 100).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment Method</span>
                      <span>{session.payment?.id ? 'BCH' : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Keep Exploring
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Discover more bachata, salsa, and kizomba experiences on
                    DanceFit.
                  </p>
                  <div className="mt-3 grid gap-2">
                    <Button onClick={handleBackToEvent}>View Event</Button>
                    <Button variant="secondary" asChild>
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl bg-primary text-primary-foreground">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-foreground/20 rounded-full p-2">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Need assistance?</p>
                    <p className="text-primary-foreground/80 text-sm">
                      support@dancefit.com
                    </p>
                  </div>
                </div>
                <p className="text-sm text-primary-foreground/90">
                  Save this page in case you need to show your QR code again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
