'use client';

import { useEffect, useState } from 'react';

import { Calendar, MapPin, Ticket, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Switch } from '@/components/ui/switch';

interface ReviewPublishStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onBack: () => void;
  onPublish: () => void;
  isSubmitting: boolean;
}

export function ReviewPublishStep({
  data,
  onUpdate,
  onBack,
  onPublish,
  isSubmitting,
}: ReviewPublishStepProps) {
  const [artists, setArtists] = useState<any[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadArtists = async () => {
      if (!data.selectedArtists.length) {
        setArtists([]);
        return;
      }
      setLoadingArtists(true);
      try {
        const responses = await Promise.all(
          data.selectedArtists.map(async (id: string) => {
            const res = await fetch(`/api/artists/${id}`);
            if (!res.ok) return null;
            const payload = await res.json();
            return payload.artist;
          }),
        );
        if (!ignore) {
          setArtists(responses.filter(Boolean));
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setArtists([]);
        }
      } finally {
        if (!ignore) {
          setLoadingArtists(false);
        }
      }
    };

    loadArtists();
    return () => {
      ignore = true;
    };
  }, [data.selectedArtists]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review & Publish</h1>
        <p className="text-muted-foreground mt-1">
          Review your event details before publishing
        </p>
      </div>

      {/* Event Summary Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
          <CardDescription>Preview how your event will appear</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner */}
          {data.banner && (
            <div className="aspect-[2/1] w-full overflow-hidden rounded-lg">
              <img
                src={data.banner || '/placeholder.svg'}
                alt="Event banner"
                className="size-full object-cover"
              />
            </div>
          )}

          {/* Title and Category */}
          <div>
            <div className="flex items-start gap-3">
              <h2 className="text-xl leading-tight font-bold text-balance">
                {data.title || 'Untitled Event'}
              </h2>
              {data.category && (
                <Badge variant="secondary" className="capitalize">
                  {data.category.toLowerCase().replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            {data.summary && (
              <p className="text-muted-foreground mt-2 text-pretty">
                {data.summary}
              </p>
            )}
          </div>

          <Separator />

          {/* Event Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Date & Time */}
            {(data.date || data.startTime || data.endTime) && (
              <div className="flex gap-3">
                <Calendar className="text-muted-foreground mt-0.5 size-5" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-muted-foreground text-sm">
                    {data.date &&
                      new Date(data.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                  </p>
                  {(data.startTime || data.endTime) && (
                    <p className="text-muted-foreground text-sm">
                      {data.startTime} - {data.endTime}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex gap-3">
              <MapPin className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                {data.locationType === 'venue' && (
                  <>
                    <p className="text-muted-foreground text-sm">
                      {data.venueName || 'Venue name'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {data.venueAddress || 'Address'}
                    </p>
                  </>
                )}
                {data.locationType === 'online' && (
                  <p className="text-muted-foreground text-sm">Online Event</p>
                )}
                {data.locationType === 'tba' && (
                  <p className="text-muted-foreground text-sm">
                    To be announced
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Overview */}
          {data.overview && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Overview</h3>
                <p className="text-muted-foreground text-sm text-pretty whitespace-pre-wrap">
                  {data.overview}
                </p>
              </div>
            </>
          )}

          {/* Good to Know */}
          {data.goodToKnow && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Good to know</h3>
                <p className="text-muted-foreground text-sm text-pretty whitespace-pre-wrap">
                  {data.goodToKnow}
                </p>
              </div>
            </>
          )}

          {/* Featured Artists */}
          {(loadingArtists || artists.length > 0) && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Users className="text-muted-foreground size-5" />
                  <h3 className="font-semibold">Featured Artists</h3>
                </div>
                {loadingArtists && (
                  <p className="text-muted-foreground text-sm">
                    Loading selected artists...
                  </p>
                )}
                {!loadingArtists && (
                  <div className="flex flex-wrap gap-3">
                    {artists.map((artist) => (
                      <div
                        key={artist.id}
                        className="bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2"
                      >
                        <Avatar className="size-8">
                          <AvatarImage
                            src={artist.user?.avatarUrl || '/placeholder.svg'}
                            alt={artist.user?.name ?? 'Artist'}
                          />
                          <AvatarFallback>
                            {(artist.user?.name ?? 'AR')
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm leading-none font-medium">
                            {artist.user?.name ?? 'Artist'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {(artist.danceStyles ?? []).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Summary */}
      {data.tickets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="text-muted-foreground size-5" />
              <CardTitle>Ticket Summary</CardTitle>
            </div>
            <CardDescription>Review your ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {ticket.name || 'Unnamed Ticket'}
                      </p>
                      {ticket.earlyBird && (
                        <Badge variant="secondary" className="text-xs">
                          Early Bird
                        </Badge>
                      )}
                      {ticket.bchDiscount && (
                        <Badge className="text-xs">BCH Discount</Badge>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {ticket.description}
                      </p>
                    )}
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>Quantity: {ticket.quantity || '0'}</span>
                      {ticket.salesStart && (
                        <span>
                          Sales start:{' '}
                          {new Date(ticket.salesStart).toLocaleDateString()}
                        </span>
                      )}
                      {ticket.salesEnd && (
                        <span>
                          Sales end:{' '}
                          {new Date(ticket.salesEnd).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ${ticket.price || '0.00'}
                    </p>
                    {ticket.earlyBird && ticket.earlyBirdPrice && (
                      <p className="text-muted-foreground text-xs line-through">
                        ${ticket.earlyBirdPrice}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility Settings</CardTitle>
          <CardDescription>Control how your event is published</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publishPublicly">Publish event publicly</Label>
              <p className="text-muted-foreground text-xs">
                Make your event visible to everyone
              </p>
            </div>
            <Switch
              id="publishPublicly"
              checked={data.publishPublicly}
              onCheckedChange={(checked) =>
                onUpdate({ ...data, publishPublicly: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowPrivateLink">
                Allow private link access
              </Label>
              <p className="text-muted-foreground text-xs">
                Share event via private link only
              </p>
            </div>
            <Switch
              id="allowPrivateLink"
              checked={data.allowPrivateLink}
              onCheckedChange={(checked) =>
                onUpdate({ ...data, allowPrivateLink: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="publishDate">
              Schedule publish date (optional)
            </Label>
            <Input
              id="publishDate"
              type="datetime-local"
              value={data.publishDate}
              onChange={(e) =>
                onUpdate({ ...data, publishDate: e.target.value })
              }
            />
            <p className="text-muted-foreground text-xs">
              Leave empty to publish immediately
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Event URL Preview</Label>
            <div className="bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2">
              <p className="text-muted-foreground truncate text-sm">
                dancefit.app/events/
                {data.title
                  ? data.title.toLowerCase().replace(/\s+/g, '-')
                  : 'your-event-name'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Tickets
        </Button>
        <Button
          onClick={onPublish}
          size="lg"
          className="px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Event'}
        </Button>
      </div>
    </div>
  );
}
