'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import QRCode from 'qrcode';

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
import { formatBchSmart, getBchQuote } from '@/lib/price-converter';

type PaymentStatus = 'waiting' | 'detected' | 'confirmed';
type QuoteResponse = {
  bch: number;
  sats: number;
  usdPerBch: number;
};

interface PaymentSessionTrackerProps {
  session: PaymentSessionDetail;
  eventIdentifier: string;
  sessionId: string;
}
//
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
  const [quuoteRes, setquuoteRes] = useState<QuoteResponse>({
    bch: 0,
    usdPerBch: 0,
    sats: 0,
  });
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (session.expiresAt) {
      const diff = new Date(session.expiresAt).getTime() - Date.now();
      return Math.max(Math.floor(diff / 1000), 0);
    }
    return 600;
  });

  // Generate QR code
  const generateQRCode = async (paywallet: string) => {
    try {
      const qrUrl = await QRCode.toDataURL(paywallet, {
        width: 320,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const ticketIssuedRef = useRef(false);

  const issueTicketForSession = useCallback(async () => {
    if (ticketIssuedRef.current) return;
    ticketIssuedRef.current = true;
    try {
      await fetch(
        `/api/payments/sessions/${encodeURIComponent(sessionId)}/issue-ticket`,
        { method: 'POST' },
      );
    } catch (err) {
      console.error('Ticket issuance failed:', err);
    }
  }, [sessionId]);

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
          await issueTicketForSession();
          setPaymentStatus('confirmed');
          const paymentId = data.session.payment?.id;
          const paymentQuery = paymentId
            ? `&paymentId=${encodeURIComponent(paymentId)}`
            : '';
          router.replace(
            `/events/${eventIdentifier}/success?session=${data.session.id}${paymentQuery}`,
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
  }, [eventIdentifier, issueTicketForSession, router, sessionId, toast]);

  useEffect(() => {
    if (!currentSession.expiresAt) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession.expiresAt]);

  const DISCOUNT_PERCENT = 0.1; // 10%
  const ticketPrice = useMemo(() => {
    return currentSession.ticketType.priceCents / 100;
  }, [currentSession.ticketType.priceCents]);

  const amountSaved = useMemo(
    () => ticketPrice * DISCOUNT_PERCENT,
    [ticketPrice],
  );

  const discountedPriceO = useMemo(
    () => ticketPrice - amountSaved,
    [ticketPrice, amountSaved],
  );

  const bchAddress =
    currentSession.payment?.bchAddress ?? currentSession.bchAddress ?? '';
  const truncatedAddress =
    bchAddress && `${bchAddress.slice(0, 16)}...${bchAddress.slice(-10)}`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // generate QR code

  useEffect(() => {
    //setIsGenerating(true);
    const handleAutoGnerate = async () => {
      const quote = await getBchQuote(ticketPrice);
      setquuoteRes(quote);
      await generateQRCode(bchAddress);
    };
    handleAutoGnerate();
  }, [bchAddress]);
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

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'waiting':
        return {
          icon: '⭕',
          text: 'Waiting for payment...',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
      case 'detected':
        return {
          icon: '🟡',
          text: 'Payment detected, awaiting confirmation...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        };
      case 'confirmed':
        return {
          icon: '🟢',
          text: 'Payment confirmed!',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
        };
    }
  };

  const statusConfig = getStatusConfig();

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

      {/* New component UI */}

      <div className="mx-auto max-w-4xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Pay with Bitcoin Cash (BCH)
          </h1>
          <p className="text-muted-foreground mt-2">
            Scan the QR code below to complete your payment
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Payment */}
          <div className="space-y-6 lg:col-span-2">
            {/* BCH Payment Card */}
            <Card className="overflow-hidden rounded-2xl border-2 border-green-500/20 shadow-lg shadow-green-500/10">
              <CardHeader className="bg-gradient-to-br from-green-500/5 to-transparent pb-6">
                <CardTitle className="text-2xl">
                  Complete Your Payment
                </CardTitle>
                <CardDescription>
                  Send the exact amount to the address below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Amount to Pay */}
                <div className="bg-muted/50 space-y-3 rounded-xl p-6">
                  <p className="text-muted-foreground text-sm font-medium">
                    Amount to Pay
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-green-600">
                      {formatBchSmart(quuoteRes.bch)} BCH
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    ≈ ${discountedPriceO.toFixed(2)} USD
                  </p>
                </div>

                <Separator />

                {/* QR Code */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-2xl bg-white shadow-xl">
                    <div className="size-64 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="h-full w-full rounded-xl border-2"
                        />
                      )}
                    </div>
                  </div>

                  {/* BCH Address */}
                  <div className="w-full space-y-2">
                    <p className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
                      BCH Address
                    </p>
                    <div className="border-border bg-muted/30 flex items-center gap-2 rounded-xl border p-3">
                      <code className="flex-1 text-center font-mono text-xs">
                        {truncatedAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Status */}
                <div className={`rounded-xl ${statusConfig.bgColor} p-4`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{statusConfig.icon}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${statusConfig.color}`}>
                        {statusConfig.text}
                      </p>
                      {paymentStatus === 'detected' && (
                        <div className="mt-2">
                          <Progress value={60} className="h-2" />
                        </div>
                      )}
                      {paymentStatus === 'confirmed' && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Redirecting to confirmation page...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                {timeRemaining > 0 && paymentStatus === 'waiting' && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                    <Clock className="size-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-600">
                      Expires in {formatTime(timeRemaining)}
                    </p>
                  </div>
                )}

                {/* Auto-redirect Note */}
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    You will be redirected automatically once payment is
                    confirmed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Reminder */}
            <Card className="hidden rounded-2xl border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold">Why pay with BCH?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span>10% instant discount applied</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span>Earn BCH cashback via CashStamp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span>Fast confirmation times</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span>No payment processor fees</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
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
                      alt={event.title}
                      className="aspect-video w-full object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {event.category}
                      </Badge>
                      <h3 className="text-lg leading-tight font-semibold text-balance">
                        {event.title}
                      </h3>
                    </div>
                    <Separator />
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-muted-foreground text-xs">
                          {formattedDate}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formattedTime}
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
                      </div>
                    </div>
                    {/* Artists */}
                    {event.artists && event.artists.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex gap-3 text-sm">
                          <User className="text-muted-foreground size-4" />
                          <div>
                            <p className="font-medium">Featured Artists</p>
                            <p className="text-muted-foreground">
                              {featuredArtists.length
                                ? featuredArtists.join(', ')
                                : 'Lineup TBA'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    <Separator />
                    {currentSession.ticketType.isEarlyBird && ' (Early Bird)'}
                    {/* Ticket & Price */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Ticket Type
                        </span>
                        <span className="font-medium">
                          {currentSession.ticketType.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Original Price
                        </span>
                        <span className="line-through">
                          ${ticketPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          BCH Discount (10%)
                        </span>
                        <span className="text-green-600">
                          -${amountSaved.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-green-600">
                          ${discountedPriceO.toFixed(2)}
                        </span>
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
  );
}
