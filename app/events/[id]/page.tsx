import Link from 'next/link';

import {
  Calendar,
  ChevronLeft,
  Clock,
  Heart,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EventDetail } from '@/lib/event-types';
import { getEventByIdentifier } from '@/lib/server-api';

interface EventDetailsPageProps {
  params: { id: string };
}

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;
  console.log('id is', id);
  const event = await getEventByIdentifier(id);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Button asChild className="mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  const formattedDate = startDate
    ? startDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBA';
  const formattedTime =
    startDate && endDate
      ? `${startDate.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })} - ${endDate.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })}`
      : startDate
        ? startDate.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Time TBA';
  const locationLabel =
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
      : event.onlineUrl || '';
  const ticketTypes = event.ticketTypes ?? [];
  const minimumPrice =
    ticketTypes.length > 0
      ? Math.min(...ticketTypes.map((ticket: any) => ticket.priceCents ?? 0)) /
        100
      : null;
  const featuredArtists =
    event.artists?.map((assignment: any) => ({
      id: assignment.artistId,
      name: assignment.artist?.user?.name ?? 'Artist',
      styles:
        assignment.artist?.danceStyles?.length > 0
          ? assignment.artist.danceStyles.join(', ')
          : '',
      avatarUrl: assignment.artist?.user?.avatarUrl,
    })) ?? [];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/events" className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="size-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-muted relative aspect-[21/9] w-full overflow-hidden">
        <img
          src={event.bannerUrl || '/placeholder.svg'}
          alt={event.title}
          className="size-full object-cover"
        />
        <div className="from-background/80 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Title & Category */}
            <div className="space-y-3">
              {event.category && (
                <Badge variant="secondary" className="text-sm capitalize">
                  {event.category.toLowerCase().replace(/_/g, ' ')}
                </Badge>
              )}
              <h1 className="text-4xl font-bold tracking-tight text-balance">
                {event.title}
              </h1>
              <p className="text-muted-foreground text-lg text-pretty">
                {event.summary}
              </p>
            </div>

            {/* Event Details */}
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-1 size-5 shrink-0" />
                  <div>
                    <p className="font-medium">Date and Time</p>
                    <p className="text-muted-foreground text-sm">
                      {formattedDate}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formattedTime}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <MapPin className="text-muted-foreground mt-1 size-5 shrink-0" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground text-sm">
                      {locationLabel}
                    </p>
                    {addressLine && (
                      <p className="text-muted-foreground text-sm">
                        {addressLine}
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Users className="text-muted-foreground mt-1 size-5 shrink-0" />
                  <div>
                    <p className="font-medium">Tickets</p>
                    <p className="text-muted-foreground text-sm">
                      {ticketTypes.length > 0
                        ? `${ticketTypes.length} ticket type${ticketTypes.length > 1 ? 's' : ''} available`
                        : 'Tickets coming soon'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Artists */}
            {featuredArtists.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Featured Artists</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featuredArtists.map((artist) => (
                    <Card key={artist.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="size-16">
                          <AvatarImage
                            src={artist.avatarUrl || '/placeholder.svg'}
                            alt={artist.name}
                          />
                          <AvatarFallback>
                            {artist.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{artist.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {artist.styles || 'Dance Artist'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">About this event</h2>
              <Card>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
                  <p className="text-foreground whitespace-pre-line">
                    {event.description || 'Details coming soon.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Good to Know */}
            {event.goodToKnow && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Good to know</h2>
                <Card>
                  <CardContent className="space-y-3 p-6">
                    <div className="space-y-2">
                      <h3 className="font-medium">Highlights</h3>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {event.goodToKnow
                          .split('\n')
                          .filter(Boolean)
                          .map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar - Ticket Purchase */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Starting from
                    </p>
                    <p className="text-primary text-3xl font-bold">
                      {minimumPrice && minimumPrice > 0
                        ? `$${minimumPrice.toFixed(2)}`
                        : 'Free'}
                    </p>
                  </div>

                  <Separator />

                  {ticketTypes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Available Tickets</h3>
                      {ticketTypes.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="border-border bg-muted/30 space-y-1 rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{ticket.name}</p>
                            <p className="text-sm font-semibold">
                              {ticket.priceCents === 0
                                ? 'Free'
                                : `$${(ticket.priceCents / 100).toFixed(2)}`}
                            </p>
                          </div>
                          {ticket.description && (
                            <p className="text-muted-foreground text-xs">
                              {ticket.description}
                            </p>
                          )}
                          {ticket.isEarlyBird && (
                            <Badge variant="secondary" className="text-xs">
                              Early Bird
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/events/${event.slug ?? event.id}/checkout`}>
                      Get Tickets
                    </Link>
                  </Button>

                  <p className="text-muted-foreground text-center text-xs">
                    Sales start{' '}
                    {startDate ? startDate.toLocaleDateString() : 'soon'}
                  </p>
                </CardContent>
              </Card>

              {/* Mobile Sticky CTA */}
              <div className="border-border bg-background fixed right-0 bottom-0 left-0 z-20 border-t p-4 lg:hidden">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">From</p>
                    <p className="text-primary text-xl font-bold">
                      {minimumPrice && minimumPrice > 0
                        ? `$${minimumPrice.toFixed(2)}`
                        : 'Free'}
                    </p>
                  </div>
                  <Button size="lg" className="flex-1" asChild>
                    <Link href={`/events/${event.slug ?? event.id}/checkout`}>
                      Get Tickets
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile sticky button */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
