'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { Calendar, MapPin, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EventDetail } from '@/lib/event-types';

const ITEMS_PER_PAGE = 9;
const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: 'all' },
  { label: 'Bachata', value: 'BACHATA' },
  { label: 'Salsa', value: 'SALSA' },
  { label: 'Kizomba', value: 'KIZOMBA' },
  { label: 'Zouk', value: 'ZOUK' },
  { label: 'Urban Kiz', value: 'URBAN_KIZ' },
  { label: 'Latin Fusion', value: 'LATIN_FUSION' },
];

interface EventsExplorerProps {
  initialEvents: EventDetail[];
}

export function EventsExplorer({ initialEvents }: EventsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<EventDetail[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (locationFilter !== 'all') params.set('city', locationFilter);
        params.set('upcoming', 'true');
        const response = await fetch(`/api/events?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load events');
        }
        const data = await response.json();
        setEvents(data.events ?? []);
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        console.error(err);
        setError('Unable to load events right now.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
    return () => controller.abort();
  }, [searchQuery, categoryFilter, locationFilter]);

  const filteredEvents = useMemo(() => {
    const filterByDate = (event: EventDetail) => {
      if (dateFilter === 'all') return true;
      if (!event.startDateTime) return false;
      const start = new Date(event.startDateTime);
      const now = new Date();
      if (Number.isNaN(start.getTime())) return false;
      if (dateFilter === 'today') {
        return start.toDateString() === now.toDateString();
      }
      if (dateFilter === 'this-week') {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        return start >= now && start <= endOfWeek;
      }
      if (dateFilter === 'this-month') {
        return (
          start.getFullYear() === now.getFullYear() &&
          start.getMonth() === now.getMonth()
        );
      }
      if (dateFilter === 'next-month') {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return (
          start.getFullYear() === next.getFullYear() &&
          start.getMonth() === next.getMonth()
        );
      }
      return true;
    };

    return events.filter((event) => filterByDate(event));
  }, [events, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / ITEMS_PER_PAGE || 1),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const uniqueCities = Array.from(
    new Set(
      events
        .map((event) => event.city)
        .filter((city): city is string => Boolean(city)),
    ),
  );

  const resetFilters = () => {
    setCategoryFilter('all');
    setLocationFilter('all');
    setDateFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <>
      <section className="border-border from-primary/5 to-background border-b bg-gradient-to-b py-12">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Discover Dance Events
            </h1>
            <p className="text-muted-foreground text-lg text-pretty">
              Find the best bachata, salsa, kizomba, and Latin dance events near
              you
            </p>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-14 pr-4 pl-12 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-border bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={locationFilter}
              onValueChange={(value) => {
                setLocationFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="next-month">Next Month</SelectItem>
              </SelectContent>
            </Select>

            {(categoryFilter !== 'all' ||
              locationFilter !== 'all' ||
              dateFilter !== 'all' ||
              searchQuery) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="mb-6 flex items-center justify-between">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading events...</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {filteredEvents.length}{' '}
                {filteredEvents.length === 1 ? 'event' : 'events'} found
              </p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="h-64 animate-pulse" />
              ))}
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-lg">
                No events found matching your criteria
              </p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedEvents.map((event) => {
                const eventDate = event.startDateTime
                  ? new Date(event.startDateTime)
                  : null;
                const formattedDate = eventDate
                  ? eventDate.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'TBA';
                const formattedTime = eventDate
                  ? eventDate.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '';
                const location = event.city
                  ? `${event.city}${event.country ? `, ${event.country}` : ''}`
                  : 'Location TBA';
                const minPrice = event.ticketTypes?.length
                  ? Math.min(
                      ...event.ticketTypes.map(
                        (ticket) => ticket.priceCents ?? 0,
                      ),
                    ) / 100
                  : null;

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug ?? event.id}`}
                  >
                    <Card className="group hover:shadow-primary/5 h-full overflow-hidden transition-all hover:shadow-lg">
                      <div className="bg-muted relative aspect-[16/9] overflow-hidden">
                        <img
                          src={event.bannerUrl || '/placeholder.svg'}
                          alt={event.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {event.category && (
                          <Badge className="bg-background/90 text-foreground absolute top-3 right-3 backdrop-blur-sm">
                            {event.category.toLowerCase().replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="space-y-3 p-4">
                        <div className="space-y-1">
                          <h3 className="group-hover:text-primary line-clamp-1 text-lg font-semibold text-balance transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {event.summary}
                          </p>
                        </div>
                        <div className="border-border space-y-2 border-t pt-3">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Calendar className="size-4 shrink-0" />
                            <span className="line-clamp-1">
                              {formattedDate}
                              {formattedTime && ` • ${formattedTime}`}
                            </span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <MapPin className="size-4 shrink-0" />
                            <span className="line-clamp-1">{location}</span>
                          </div>
                        </div>
                        <div className="border-border flex items-center justify-between border-t pt-3">
                          <span className="text-primary text-lg font-semibold">
                            {minPrice && minPrice > 0
                              ? `$${minPrice.toFixed(2)}+`
                              : 'Free'}
                          </span>
                          <Button size="sm">Get Tickets</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                    className="size-10 p-0"
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
