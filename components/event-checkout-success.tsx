'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  Download,
  MapPin,
  QrCode,
  Share2,
  Ticket,
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
  cashbackDetails: CashbackPayload;
}

export function EventCheckoutSuccess({
  session,
  eventIdentifier,
  paymentId,
  cashbackDetails,
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
  const [cashBackqrCodeUrl, setCashBackQrCodeUrl] = useState<string>('');
  /*const [cashbackDetails, setCashbackDetails] = useState<CashbackPayload | null>(
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
  }, [paymentId]);*/

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
      setCashBackQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // generate QR code

  useEffect(() => {
    //setIsGenerating(true);
    const handleAutoGnerate = async () => {
      //const quote = await getBchQuote(ticketPrice);
      //setquuoteRes(quote);
      await generateQRCode(cashbackDetails?.wifEncrypted);
    };
    handleAutoGnerate();
  }, []);
  const DISCOUNT_PERCENT = 0.1; // 10%
  const fallbackCashback = session.payment?.cashback ?? null;
  const cashbackAmount =
    cashbackDetails?.amountSats ?? fallbackCashback?.amountSats ?? null;
  const ticketPrice = useMemo(() => {
    return session.ticketType.priceCents / 100;
  }, [session.ticketType.priceCents]);

  const amountSaved = useMemo(
    () => ticketPrice * DISCOUNT_PERCENT,
    [ticketPrice],
  );
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
      event.artists
        ?.map((assignment) => assignment.artist?.user?.name)
        .filter(Boolean) ?? [],
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
    <div className="via-background to-background min-h-screen bg-gradient-to-b from-green-50/30 dark:from-green-950/10">
      {/* Header */}
      <header className="border-border bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/events" className="flex items-center gap-2">
              <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-lg font-bold">
                  D
                </span>
              </div>
              <span className="hidden text-xl font-semibold sm:inline">
                DancePulse
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Success Header */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-balance">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your NFT ticket has been issued.
            </p>
          </div>

          <div className="space-y-6">
            {/* Ticket Card */}
            <Card className="overflow-hidden rounded-2xl border-2 border-green-500/20 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="size-6 text-green-600" />
                    <CardTitle className="text-2xl">Your Ticket</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    NFT Ticket Issued
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Reference Code
                    </p>
                    <p className="font-mono text-lg font-semibold">
                      {ticket?.referenceCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">Status</p>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      Confirmed
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Ticket Type
                    </p>
                    <p className="font-semibold">{session?.ticketType.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Attendee Name
                    </p>
                    <p className="font-semibold">
                      {session?.attendeeName || 'Guest'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground mb-1 text-sm">Event</p>
                    <p className="font-semibold">{event.title}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground mb-1 text-sm">
                      Date & Time
                    </p>
                    <p className="font-medium">
                      {formattedDate} • {formattedTime}
                    </p>
                  </div>
                </div>

                <Separator />

                <Button className="w-full" size="lg">
                  <Download className="mr-2 size-4" />
                  Download Ticket
                </Button>
              </CardContent>
            </Card>

            {/* Cashback (CashStamp) Section */}
            <Card className="overflow-hidden rounded-2xl border-2 border-orange-500/20">
              <CardHeader className="bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <Coins className="size-6 text-orange-600" />
                  <CardTitle className="text-xl">
                    Claim Your BCH Cashback
                  </CardTitle>
                </div>
                <CardDescription>
                  Scan to claim your BCH cashback reward for attending this
                  event.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  {/* CashStamp QR */}
                  <div className="shrink-0 rounded-xl border-2 border-orange-500/20 bg-orange-50 p-4 dark:bg-orange-950/20">
                    <div className="size-64 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                      {cashBackqrCodeUrl && (
                        <img
                          src={cashBackqrCodeUrl}
                          alt="QR Code"
                          className="h-full w-full rounded-xl border-2"
                        />
                      )}
                    </div>
                  </div>

                  {/* Cashback Amount */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <p className="text-muted-foreground mb-2 text-sm">
                        Your Cashback Reward
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        ≈ ${amountSaved.toFixed(2)} USD
                      </p>
                    </div>
                    <p className="text-sm">
                      Scan the QR code with CashStamp to claim your BCH reward
                      after attending the event.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Delivery - Selene Wallet */}
            <Card className="hidden rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <QrCode className="text-primary size-6" />
                  <CardTitle className="text-xl">
                    Add Your NFT Ticket to Selene Wallet
                  </CardTitle>
                </div>
                <CardDescription>
                  Scan with Selene Wallet to import your NFT event ticket.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  {/* QR Code */}
                  <div className="border-border shrink-0 rounded-xl border-2 bg-white p-4">
                    <div className="size-40 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
                      <img
                        src={`/placeholder.svg?height=160&width=160&query=Selene+Wallet+NFT+QR+code`}
                        alt="Selene Wallet QR Code"
                        className="size-full rounded-lg object-cover"
                      />
                    </div>
                  </div>

                  {/* NFT Token ID */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-muted-foreground mb-2 text-sm font-medium">
                        NFT Token ID
                      </p>
                      <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border p-3">
                        <code className="flex-1 font-mono text-xs">
                          {nftTokenId}
                        </code>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      {copiedTokenId ? (
                        <Check className="mr-2 size-4 text-green-600" />
                      ) : (
                        <Copy className="mr-2 size-4" />
                      )}
                      {copiedTokenId ? 'Copied!' : 'Copy NFT Token ID'}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Note:</strong> Your NFT ticket can be used for event
                    entry, traded, or kept as a digital collectible. Download
                    the Selene Wallet app to manage your NFT tickets.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event Summary */}

            {/* Share Section */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Share2 className="text-primary size-6" />
                  <CardTitle className="text-xl">Share This Event</CardTitle>
                </div>
                <CardDescription>
                  Invite your friends to join this amazing event!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full bg-transparent">
                  {copiedEventLink ? (
                    <Check className="mr-2 size-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 size-4" />
                  )}
                  {copiedEventLink ? 'Copied!' : 'Copy Event Link'}
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <svg
                    className="mr-2 size-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Share on WhatsApp
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Share2 className="mr-2 size-4" />
                  Share on Instagram Story
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 bg-transparent"
                asChild
              >
                <Link href="/events">Browse More Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
