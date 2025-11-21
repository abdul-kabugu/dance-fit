'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Calendar, ChevronLeft, MapPin, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { EventDetail } from '@/lib/event-types';

interface EventCheckoutFormProps {
  event: EventDetail;
  eventIdentifier: string;
  preselectedTicketId?: string | null;
}

export function EventCheckoutForm({
  event,
  eventIdentifier,
  preselectedTicketId,
}: EventCheckoutFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const ticketTypes = event.ticketTypes ?? [];
  const initialTicket = useMemo(() => {
    if (!ticketTypes.length) return null;
    if (preselectedTicketId) {
      const match = ticketTypes.find(
        (ticket) => ticket.id === preselectedTicketId,
      );
      if (match) return match;
    }
    return ticketTypes[0] ?? null;
  }, [ticketTypes, preselectedTicketId]);
  const [selectedTicket, setSelectedTicket] = useState(
    initialTicket ?? null,
  );
  useEffect(() => {
    setSelectedTicket(initialTicket ?? null);
  }, [initialTicket]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eventStart = event.startDateTime ? new Date(event.startDateTime) : null;
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
    event.artists?.map((assignment) => assignment.artist?.user?.name) ??
    [];

  const ticketPriceLabel = useMemo(() => {
    if (!selectedTicket) return 'Free';
    return selectedTicket.priceCents === 0
      ? 'Free'
      : `$${(selectedTicket.priceCents / 100).toFixed(2)}`;
  }, [selectedTicket]);

  const handleContinue = async () => {
    if (!fullName || !email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in your name and email to continue.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedTicket) {
      toast({
        title: 'Ticket unavailable',
        description: 'Please select a ticket before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketTypeId: selectedTicket.id,
          quantity: 1,
          attendeeName: fullName,
          attendeeEmail: email,
          attendeePhone: phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to start checkout session.');
      }

      const result = await response.json();
      sessionStorage.setItem(
        'checkoutData',
        JSON.stringify({
          sessionId: result.session.id,
          eventId: event.id,
          fullName,
          email,
          phone,
          ticketTypeId: selectedTicket.id,
        }),
      );
      router.push(
        `/events/${eventIdentifier}/checkout/payment?session=${result.session.id}`,
      );
    } catch (error) {
      console.error(error);
      toast({
        title: 'Checkout failed',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedTicket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tickets unavailable</h1>
          <Button asChild className="mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="border-border bg-background border-b">
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
              Secure Checkout
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">
              Step 1 of 2 — Your Information
            </p>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Complete Your Purchase
            </h1>
            <p className="text-muted-foreground mt-2">
              You're almost there! Just a few details and you're in.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>
                    Please provide your details to complete the registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      Your ticket will be sent to this email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Ticket Summary</h3>
                    <div className="border-border bg-muted/40 rounded-xl border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{selectedTicket.name}</p>
                          {selectedTicket.description && (
                            <p className="text-muted-foreground text-sm">
                              {selectedTicket.description}
                            </p>
                          )}
                          {selectedTicket.isEarlyBird && (
                            <Badge variant="secondary" className="text-xs">
                              Early Bird
                            </Badge>
                          )}
                          <p className="text-muted-foreground text-sm">
                            Quantity: 1
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {ticketPriceLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-primary/5 flex items-center justify-between rounded-xl p-4">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-primary text-2xl font-bold">
                      {ticketPriceLabel}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Continue to Payment'}
                  </Button>

                  <p className="text-muted-foreground text-center text-xs">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={event.bannerUrl || '/placeholder.svg'}
                        alt={event.title}
                        className="aspect-video w-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        {event.category && (
                          <Badge
                            variant="secondary"
                            className="mb-2 text-xs capitalize"
                          >
                            {event.category.toLowerCase().replace(/_/g, ' ')}
                          </Badge>
                        )}
                        <h3 className="text-lg leading-tight font-semibold text-balance">
                          {event.title}
                        </h3>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
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

                      <Separator />

                      <div className="flex items-start gap-3">
                        <User className="text-muted-foreground mt-0.5 size-4 shrink-0" />
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
                  </CardContent>
                </Card>

                <div className="mt-4 rounded-2xl bg-card p-4 text-sm">
                  <p className="font-semibold">Why register now?</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>• Secure your spot before tickets sell out</li>
                    <li>• Access exclusive BCH discounts</li>
                    <li>• Instant QR code delivery to your email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
