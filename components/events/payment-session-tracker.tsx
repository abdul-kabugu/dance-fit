'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  MapPin,
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { PaymentSessionDetail } from '@/lib/event-types';

type PaymentStatus = 'waiting' | 'detected' | 'confirmed';

interface PaymentSessionTrackerProps {
  session: PaymentSessionDetail;
  eventIdentifier: string;
  sessionId: string;
}

export function PaymentSessionTracker({
  session,
  eventIdentifier,
  sessionId,
}: PaymentSessionTrackerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState(session);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(() => {
    if (session.payment?.status === 'COMPLETED') return 'confirmed';
    if (session.payment?.status === 'PENDING') return 'detected';
    return 'waiting';
  });
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (session.expiresAt) {
      const diff = new Date(session.expiresAt).getTime() - Date.now();
      return Math.max(Math.floor(diff / 1000), 0);
    }
    return 600;
  });

  useEffect(() => {
    let cancelled = false;
    const fetchSession = async () => {
      try {
        // 1. Trigger backend Electrum verification (updates DB)
        try {
          await fetch(`/api/payments/verify/${encodeURIComponent(sessionId)}`, {
            cache: 'no-store',
          });
        } catch (err) {
          // Electrum errors should NOT break feechSession
          console.warn('Payment verification error:', err);
        }
        const response = await fetch(
          `/api/payments/sessions/${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          throw new Error('Payment session not found.');
        }
        const data = await response.json();
        if (cancelled) return;
        setCurrentSession(data.session);
        if (data.session.payment?.status === 'COMPLETED') {
          setPaymentStatus('confirmed');
          router.replace(
            `/events/${eventIdentifier}/success?session=${data.session.id}`,
          );
        } else if (data.session.payment?.status === 'PENDING') {
          setPaymentStatus('detected');
        } else {
          setPaymentStatus('waiting');
        }
        if (data.session.expiresAt) {
          const diff = new Date(data.session.expiresAt).getTime() - Date.now();
          setTimeRemaining(Math.max(Math.floor(diff / 1000), 0));
        }
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        toast({
          title: 'Payment session error',
          description: 'Please restart your checkout.',
          variant: 'destructive',
        });
        router.push(`/events/${eventIdentifier}/checkout`);
      }
    };

    const poll = setInterval(fetchSession, 5000);
    fetchSession();
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [eventIdentifier, router, sessionId, toast]);

  useEffect(() => {
    if (!currentSession.expiresAt) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession.expiresAt]);

  const ticketPrice = useMemo(() => {
    return currentSession.ticketType.priceCents / 100;
  }, [currentSession.ticketType.priceCents]);

  const bchAmount = useMemo(() => {
    if (!currentSession.payment?.bchAmountSats) return '0.000000';
    return (currentSession.payment.bchAmountSats / 1e8).toFixed(6);
  }, [currentSession.payment?.bchAmountSats]);

  const bchAddress =
    currentSession.payment?.bchAddress ?? currentSession.bchAddress ?? '';
  const truncatedAddress =
    bchAddress && `${bchAddress.slice(0, 16)}...${bchAddress.slice(-10)}`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async () => {
    if (!bchAddress) return;
    try {
      await navigator.clipboard.writeText(bchAddress);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: 'BCH address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the address manually.',
        variant: 'destructive',
      });
    }
  };

  const statusConfig = (() => {
    switch (paymentStatus) {
      case 'waiting':
        return { icon: '⭕', text: 'Waiting for payment...' };
      case 'detected':
        return {
          icon: '🟡',
          text: 'Payment detected, awaiting confirmation...',
        };
      case 'confirmed':
        return {
          icon: '🟢',
          text: 'Payment confirmed! Redirecting...',
        };
    }
  })();

  const event = currentSession.event;
  const eventStart = event.startDateTime ? new Date(event.startDateTime) : null;
  const formattedDate = eventStart
    ? eventStart.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : 'Date TBA';
  const formattedTime = eventStart
    ? eventStart.toLocaleTimeString(undefined, {
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
  const eventAddress =
    event.locationType === 'VENUE'
      ? [event.addressLine1, event.city, event.country]
          .filter(Boolean)
          .join(', ')
      : event.onlineUrl;
  const featuredArtists =
    event.artists?.map((assignment) => assignment.artist?.user?.name) ?? [];

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/events/${eventIdentifier}`}
              className="flex items-center gap-2"
            >
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
              Secure BCH Checkout
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Complete Your BCH Payment
              </CardTitle>
              <CardDescription>
                Send the exact amount to the address below before the timer
                expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border p-5">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Amount Due
                    </p>
                    <p className="text-4xl font-bold tracking-tight">
                      {bchAmount} BCH
                    </p>
                    <p className="text-muted-foreground text-sm">
                      ≈ ${ticketPrice.toFixed(2)} USD
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                      Session Expires In
                    </p>
                    <p className="text-2xl font-semibold">
                      {formatTime(timeRemaining)}
                    </p>
                    <Progress value={(timeRemaining / 600) * 100} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm font-medium">
                    Payment Address
                  </p>
                  <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-mono text-sm">
                      {truncatedAddress || '---'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={copyToClipboard}>
                        <Copy className="mr-2 size-4" />
                        {copied ? 'Copied' : 'Copy Address'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-sm font-semibold">
                    Payment Status
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <span>{statusConfig.icon}</span>
                    <span>{statusConfig.text}</span>
                  </div>
                </div>

                <div className="text-muted-foreground grid gap-3 text-sm">
                  <p>1. Open your BCH wallet.</p>
                  <p>
                    2. Send <strong>{bchAmount} BCH</strong> to the address
                    above.
                  </p>
                  <p>3. Stay on this page while we detect your payment.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Event Summary</CardTitle>
              <CardDescription>
                Review the details before completing your payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">
                    Event
                  </p>
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {event.summary}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm">
                    <Calendar className="text-muted-foreground size-4" />
                    <div>
                      <p className="font-medium">Date &amp; Time</p>
                      <p className="text-muted-foreground">
                        {formattedDate} — {formattedTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <MapPin className="text-muted-foreground size-4" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{eventLocation}</p>
                      {eventAddress && (
                        <p className="text-muted-foreground">{eventAddress}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <User className="text-muted-foreground size-4" />
                    <div>
                      <p className="font-medium">Artists</p>
                      <p className="text-muted-foreground">
                        {featuredArtists.length
                          ? featuredArtists.join(', ')
                          : 'Lineup TBA'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-muted-foreground text-sm font-medium">
                  Ticket Details
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>{currentSession.ticketType.name}</span>
                  <span>
                    ${ticketPrice.toFixed(2)}
                    {currentSession.ticketType.isEarlyBird && ' (Early Bird)'}
                  </span>
                </div>
                <div className="text-muted-foreground mt-2 flex items-center justify-between text-sm">
                  <span>Attendee</span>
                  <span>{currentSession.attendeeName}</span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>Email</span>
                  <span>{currentSession.attendeeEmail}</span>
                </div>
              </div>

              <div className="bg-muted/40 text-muted-foreground rounded-xl p-4 text-sm">
                <p className="font-semibold">Need help?</p>
                <p>Contact support@dancefit.com for assistance.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
