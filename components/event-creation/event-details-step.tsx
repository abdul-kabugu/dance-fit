'use client';

import { useEffect, useState } from 'react';

import { Calendar, Clock, MapPin, Upload, Video } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadToBlob } from '@/lib/upload';

interface EventDetailsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

interface ArtistOption {
  id: string;
  name: string;
  styles: string;
  avatarUrl?: string | null;
}

export function EventDetailsStep({
  data,
  onUpdate,
  onNext,
}: EventDetailsStepProps) {
  const { toast } = useToast();
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    data.banner,
  );
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('/api/artists?limit=100', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load artists');
        }
        const data = await response.json();
        const mapped: ArtistOption[] = (data.artists ?? []).map(
          (artist: any) => ({
            id: artist.id,
            name: artist.user?.name ?? 'Unnamed Artist',
            styles:
              artist.danceStyles?.length > 0
                ? artist.danceStyles.join(', ')
                : 'Dance Artist',
            avatarUrl: artist.user?.avatarUrl,
          }),
        );
        setArtists(mapped);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Failed to load artists',
          description: 'You can continue without attaching artists.',
          variant: 'destructive',
        });
      } finally {
        setArtistsLoading(false);
      }
    };

    fetchArtists();
  }, [toast]);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const { url } = await uploadToBlob(file, `event-${file.name}`);
      setBannerPreview(url);
      onUpdate({ ...data, banner: url });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload failed',
        description: 'Please try uploading a smaller image.',
        variant: 'destructive',
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const toggleArtist = (artistId: string) => {
    const selected = data.selectedArtists.includes(artistId)
      ? data.selectedArtists.filter((id: string) => id !== artistId)
      : [...data.selectedArtists, artistId];
    onUpdate({ ...data, selectedArtists: selected });
  };

  return (
    <div className="space-y-6">
      {/* Banner Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Event Banner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label htmlFor="banner-upload" className="cursor-pointer">
              {bannerPreview ? (
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
                  <img
                    src={bannerPreview || '/placeholder.svg'}
                    alt="Event banner"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <Button variant="secondary" size="sm">
                      <Upload className="mr-2" />
                      Change Banner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50 flex aspect-[2/1] w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors">
                  <div className="text-center">
                    <Upload className="text-muted-foreground mx-auto size-8" />
                    <p className="mt-2 text-sm font-medium">
                      Upload photos and video
                    </p>
                  </div>
                </div>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleBannerChange}
              />
            </label>
            <p className="text-muted-foreground text-xs">
              Recommended: 2160x1080px — Max size 10MB — Formats: .JPEG, .PNG
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Event Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event title *</Label>
            <Input
              id="title"
              placeholder="Event title"
              value={data.title}
              onChange={(e) => onUpdate({ ...data, title: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              Be clear and descriptive with a title that tells people what your
              event is about.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              placeholder="Summary"
              value={data.summary}
              onChange={(e) => onUpdate({ ...data, summary: e.target.value })}
              maxLength={140}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                Grab people's attention with a short description about your
                event. Attendees will see this at the top of your event page.
              </p>
              <span className="text-muted-foreground">
                {data.summary.length}/140
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Dance Category *</Label>
            <Select
              value={data.category}
              onValueChange={(value) => onUpdate({ ...data, category: value })}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BACHATA">Bachata</SelectItem>
                <SelectItem value="SALSA">Salsa</SelectItem>
                <SelectItem value="KIZOMBA">Kizomba</SelectItem>
                <SelectItem value="ZOUK">Zouk</SelectItem>
                <SelectItem value="URBAN_KIZ">Urban Kiz</SelectItem>
                <SelectItem value="AFRO">Afro</SelectItem>
                <SelectItem value="TANGO">Tango</SelectItem>
                <SelectItem value="HIP_HOP">Hip Hop</SelectItem>
                <SelectItem value="CONTEMPORARY">Contemporary</SelectItem>
                <SelectItem value="REGGAETON">Reggaeton</SelectItem>
                <SelectItem value="LATIN_FUSION">Latin Fusion</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date and Location */}
      <Card>
        <CardHeader>
          <CardTitle>Date and location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Type of event</Label>
            <RadioGroup
              value={data.eventType}
              onValueChange={(value: 'single' | 'recurring') =>
                onUpdate({ ...data, eventType: value })
              }
              className="flex gap-4"
            >
              <div className="border-input bg-background has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex flex-1 items-center gap-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem value="single" id="single" />
                <div className="flex flex-1 items-center gap-3">
                  <Calendar className="text-muted-foreground size-5" />
                  <div className="flex-1">
                    <Label
                      htmlFor="single"
                      className="cursor-pointer font-medium"
                    >
                      Single event
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      For events that happen once
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-input bg-background has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex flex-1 items-center gap-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem value="recurring" id="recurring" />
                <div className="flex flex-1 items-center gap-3">
                  <Calendar className="text-muted-foreground size-5" />
                  <div className="flex-1">
                    <Label
                      htmlFor="recurring"
                      className="cursor-pointer font-medium"
                    >
                      Recurring event
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                    <p className="text-muted-foreground text-xs">
                      For timed entry and multiple days
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Date and time</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-muted-foreground text-xs">
                  Date
                </Label>
                <div className="relative">
                  <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="date"
                    type="date"
                    value={data.date}
                    onChange={(e) =>
                      onUpdate({ ...data, date: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="startTime"
                  className="text-muted-foreground text-xs"
                >
                  Start time
                </Label>
                <div className="relative">
                  <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="startTime"
                    type="time"
                    value={data.startTime}
                    onChange={(e) =>
                      onUpdate({ ...data, startTime: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="endTime"
                  className="text-muted-foreground text-xs"
                >
                  End time
                </Label>
                <div className="relative">
                  <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="endTime"
                    type="time"
                    value={data.endTime}
                    onChange={(e) =>
                      onUpdate({ ...data, endTime: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Location</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={data.locationType === 'venue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ ...data, locationType: 'venue' })}
              >
                <MapPin className="mr-2" />
                Venue
              </Button>
              <Button
                type="button"
                variant={data.locationType === 'online' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ ...data, locationType: 'online' })}
              >
                <Video className="mr-2" />
                Online event
              </Button>
              <Button
                type="button"
                variant={data.locationType === 'tba' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ ...data, locationType: 'tba' })}
              >
                <Calendar className="mr-2" />
                To be announced
              </Button>
            </div>

            {data.locationType === 'venue' && (
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Venue name *"
                  value={data.venueName}
                  onChange={(e) =>
                    onUpdate({ ...data, venueName: e.target.value })
                  }
                />
                <Input
                  placeholder="Address *"
                  value={data.venueAddress}
                  onChange={(e) =>
                    onUpdate({ ...data, venueAddress: e.target.value })
                  }
                />
              </div>
            )}

            {data.locationType === 'online' && (
              <div className="pt-2">
                <Input
                  placeholder="Meeting URL *"
                  value={data.meetingUrl}
                  onChange={(e) =>
                    onUpdate({ ...data, meetingUrl: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Description */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Add details about activities, schedule, expectations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe your event in detail..."
            value={data.overview}
            onChange={(e) => onUpdate({ ...data, overview: e.target.value })}
            className="min-h-32"
          />
        </CardContent>
      </Card>

      {/* Good to Know */}
      <Card>
        <CardHeader>
          <CardTitle>Good to know</CardTitle>
          <CardDescription>Add highlights, FAQs, or rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add important information, frequently asked questions, or event rules..."
            value={data.goodToKnow}
            onChange={(e) => onUpdate({ ...data, goodToKnow: e.target.value })}
            className="min-h-24"
          />
        </CardContent>
      </Card>

      {/* Select Artists */}
      <Card>
        <CardHeader>
          <CardTitle>Select Artists</CardTitle>
          <CardDescription>
            Choose the featured artists for your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {artistsLoading && (
              <p className="text-muted-foreground text-sm">
                Loading artists...
              </p>
            )}
            {!artistsLoading && artists.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No artists found yet. Create artist profiles to attach them to
                events.
              </p>
            )}
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="border-input bg-background has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Checkbox
                  id={`artist-${artist.id}`}
                  checked={data.selectedArtists.includes(artist.id)}
                  onCheckedChange={() => toggleArtist(artist.id)}
                />
                <Avatar className="size-10">
                  <AvatarImage
                    src={artist.avatarUrl || '/placeholder.svg'}
                    alt={artist.name}
                  />
                  <AvatarFallback>
                    {artist.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label
                    htmlFor={`artist-${artist.id}`}
                    className="cursor-pointer font-medium"
                  >
                    {artist.name}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {artist.styles}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost">Save as Draft</Button>
        <Button onClick={onNext} size="lg">
          Next: Add Tickets
        </Button>
      </div>
    </div>
  );
}
