import { NextRequest } from 'next/server';

import { EventCategory, EventStatus, Prisma } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/strings';
import { eventPayloadSchema } from '@/lib/validators';

const DEFAULT_PAGE_SIZE = 12;

function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid date value: ${value}`);
  }
  return date;
}

function resolveTimestamp(
  direct?: string | null,
  dateOnly?: string | null,
  timeOnly?: string | null,
) {
  if (direct) return toDate(direct);
  if (dateOnly && timeOnly) {
    return toDate(`${dateOnly}T${timeOnly}`);
  }
  return undefined;
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base || `event-${Date.now()}`;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get('search') ?? undefined;
    const statusParam = params.get('status') ?? undefined;
    const categoryParam = params.get('category') ?? undefined;
    const city = params.get('city') ?? undefined;
    const organizerParam = params.get('organizer') ?? undefined;
    const upcoming = params.get('upcoming') === 'true';
    const page = Number.parseInt(params.get('page') ?? '1', 10);
    const limit = Number.parseInt(
      params.get('limit') ?? `${DEFAULT_PAGE_SIZE}`,
      10,
    );

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusParam && statusParam in EventStatus) {
      where.status = statusParam as EventStatus;
    }

    if (categoryParam && categoryParam in EventCategory) {
      where.category = categoryParam as EventCategory;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (upcoming) {
      where.startDateTime = { gte: new Date() };
    }

    if (organizerParam === 'me') {
      const { organizer } = await requireOrganizerContext();
      where.organizerId = organizer.id;
    } else if (!statusParam) {
      where.status = EventStatus.PUBLISHED;
      where.isPublic = true;
    }

    const take = Number.isNaN(limit) ? DEFAULT_PAGE_SIZE : limit;
    const skip = Math.max(page - 1, 0) * take;

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: true,
        ticketTypes: true,
        artists: {
          include: {
            artist: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
      skip,
      take,
    });

    return respond({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = eventPayloadSchema.parse(body);
    const { organizer } = await requireOrganizerContext();

    const startDateTime =
      resolveTimestamp(
        payload.startDateTime,
        payload.date,
        payload.startTime,
      ) ?? new Date();
    const endDateTime =
      resolveTimestamp(payload.endDateTime, payload.date, payload.endTime) ??
      new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    if (endDateTime <= startDateTime) {
      throw new ApiError(
        400,
        'Event end time must be after the start time.',
      );
    }

    const slug = await generateUniqueSlug(payload.title);
    const publishAt = payload.publishDate ? toDate(payload.publishDate) : null;
    const publishImmediately =
      payload.publishPublicly && (!publishAt || publishAt <= new Date());
    const status = publishImmediately
      ? EventStatus.PUBLISHED
      : EventStatus.DRAFT;

    const ticketCreates = payload.tickets.map((ticket) => ({
      name: ticket.name,
      description: ticket.description,
      priceCents: ticket.price,
      currency: ticket.currency,
      quantityTotal: ticket.quantity,
      salesStart: ticket.salesStart ? toDate(ticket.salesStart) : undefined,
      salesEnd: ticket.salesEnd ? toDate(ticket.salesEnd) : undefined,
      isEarlyBird: ticket.earlyBird,
      earlyBirdPriceCents:
        ticket.earlyBird && ticket.earlyBirdPrice
          ? ticket.earlyBirdPrice
          : undefined,
      earlyBirdEndsAt: ticket.earlyBirdEndsAt
        ? toDate(ticket.earlyBirdEndsAt)
        : undefined,
      visible: ticket.displayOnPage,
      isBchDiscounted: ticket.bchDiscount,
    }));

    const event = await prisma.event.create({
      data: {
        slug,
        organizerId: organizer.id,
        title: payload.title,
        summary: payload.summary,
        description: payload.overview,
        goodToKnow: payload.goodToKnow,
        bannerUrl: payload.bannerUrl,
        category: payload.category,
        type: payload.eventType,
        status,
        isPublic: payload.publishPublicly,
        allowPrivateAccess: payload.allowPrivateLink,
        publishAt,
        locationType: payload.locationType,
        venueName: payload.venueName,
        addressLine1: payload.venueAddress,
        city: payload.city,
        country: payload.country,
        onlineUrl: payload.meetingUrl,
        timezone: payload.timezone,
        startDateTime,
        endDateTime,
        ticketTypes: {
          create: ticketCreates,
        },
        artists: {
          create: Array.from(new Set(payload.selectedArtists)).map(
            (artistId) => ({
              artist: { connect: { id: artistId } },
            }),
          ),
        },
      },
      include: {
        ticketTypes: true,
        artists: {
          include: { artist: true },
        },
      },
    });

    return respond({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
