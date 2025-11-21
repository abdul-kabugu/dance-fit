import { Calendar, MapPin, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type UpcomingEvent = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  artists: string[];
  attendees?: number;
  capacity?: number;
};

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Your next scheduled dance events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border-border hover:bg-accent/50 flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center"
          >
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                {(event.attendees ?? event.capacity) && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.attendees ?? 0}/{event.capacity ?? '—'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {event.artists.map((artist, i) => (
                  <span
                    key={i}
                    className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View
              </Button>
              <Button size="sm">Edit</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
