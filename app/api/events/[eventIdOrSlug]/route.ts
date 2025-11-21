import type { NextRequest } from 'next/server';

import { EventStatus, Prisma } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { eventPayloadSchema } from '@/lib/validators';

interface RouteContext {
  params: { eventIdOrSlug: string };
}

function normalizeIdentifier(raw: string) {
  const trimmed = raw.trim();
  return {
    idCandidate: trimmed,
    slugCandidate: trimmed.toLowerCase(),
  };
}

async function findEvent(eventIdOrSlug: string) {
  //const { idCandidate, slugCandidate } = normalizeIdentifier(eventIdOrSlug);
  //console.log('slug is ', slugCandidate);
  return prisma.event.findFirst({
    /* where: {
      OR: [{ id: idCandidate }, { slug: slugCandidate }],
    },*/
    where: {
      slug: eventIdOrSlug,
    },
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
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params; // 🔥 FIX HERE
    const eventIdOrSlug = params.eventIdOrSlug;
    const event = await findEvent(eventIdOrSlug);
    if (!event) {
      throw new ApiError(404, 'Event not found.');
    }

    if (
      event.status !== EventStatus.PUBLISHED ||
      (!event.isPublic && !event.allowPrivateAccess)
    ) {
      const { organizer } = await requireOrganizerContext();
      if (organizer.id !== event.organizerId) {
        throw new ApiError(403, 'You do not have access to this event.');
      }
    }
    //
    return respond({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json();
    const payload = eventPayloadSchema.deepPartial().parse(body);
    const { organizer } = await requireOrganizerContext();

    const existing = await findEvent(context.params.eventIdOrSlug);
    if (!existing || existing.organizerId !== organizer.id) {
      throw new ApiError(404, 'Event not found.');
    }

    const data: Prisma.EventUpdateInput = {};

    if (payload.title) data.title = payload.title;
    if (payload.summary) data.summary = payload.summary;
    if (payload.overview !== undefined) data.description = payload.overview;
    if (payload.goodToKnow !== undefined) data.goodToKnow = payload.goodToKnow;
    if (payload.bannerUrl !== undefined) data.bannerUrl = payload.bannerUrl;
    if (payload.category) data.category = payload.category;
    if (payload.eventType) data.type = payload.eventType;
    if (payload.publishPublicly !== undefined)
      data.isPublic = payload.publishPublicly;
    if (payload.allowPrivateLink !== undefined)
      data.allowPrivateAccess = payload.allowPrivateLink;
    if (payload.publishDate) data.publishAt = new Date(payload.publishDate);
    if (payload.locationType) data.locationType = payload.locationType;
    if (payload.venueName !== undefined) data.venueName = payload.venueName;
    if (payload.venueAddress !== undefined)
      data.addressLine1 = payload.venueAddress;
    if (payload.city !== undefined) data.city = payload.city;
    if (payload.country !== undefined) data.country = payload.country;
    if (payload.meetingUrl !== undefined) data.onlineUrl = payload.meetingUrl;
    if (payload.timezone !== undefined) data.timezone = payload.timezone;

    if (payload.startDateTime) {
      data.startDateTime = new Date(payload.startDateTime);
    }
    if (payload.endDateTime) {
      data.endDateTime = new Date(payload.endDateTime);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: existing.id },
        data,
        include: {
          ticketTypes: true,
          artists: { include: { artist: true } },
        },
      });

      if (payload.selectedArtists) {
        await tx.artistOnEvent.deleteMany({
          where: { eventId: existing.id },
        });

        if (payload.selectedArtists.length) {
          await tx.artistOnEvent.createMany({
            data: payload.selectedArtists.map((artistId) => ({
              eventId: existing.id,
              artistId,
            })),
          });
        }
      }

      if (payload.tickets) {
        for (const ticket of payload.tickets) {
          if (ticket.id) {
            const updateData: Prisma.TicketTypeUpdateInput = {};
            if (ticket.name) updateData.name = ticket.name;
            if (ticket.description !== undefined)
              updateData.description = ticket.description;
            if (ticket.price !== undefined)
              updateData.priceCents = ticket.price;
            if (ticket.quantity !== undefined)
              updateData.quantityTotal = ticket.quantity;
            if (ticket.salesStart !== undefined) {
              updateData.salesStart = ticket.salesStart
                ? new Date(ticket.salesStart)
                : null;
            }
            if (ticket.salesEnd !== undefined) {
              updateData.salesEnd = ticket.salesEnd
                ? new Date(ticket.salesEnd)
                : null;
            }
            if (ticket.earlyBird !== undefined) {
              updateData.isEarlyBird = ticket.earlyBird;
            }
            if (ticket.earlyBirdPrice !== undefined) {
              updateData.earlyBirdPriceCents = ticket.earlyBirdPrice ?? null;
            }
            if (ticket.earlyBirdEndsAt !== undefined) {
              updateData.earlyBirdEndsAt = ticket.earlyBirdEndsAt
                ? new Date(ticket.earlyBirdEndsAt)
                : null;
            }
            if (ticket.displayOnPage !== undefined) {
              updateData.visible = ticket.displayOnPage;
            }
            if (ticket.bchDiscount !== undefined) {
              updateData.isBchDiscounted = ticket.bchDiscount;
            }
            await tx.ticketType.update({
              where: { id: ticket.id },
              data: updateData,
            });
          } else {
            await tx.ticketType.create({
              data: {
                eventId: existing.id,
                name: ticket.name ?? 'New Ticket',
                description: ticket.description,
                priceCents: ticket.price ?? 0,
                currency: ticket.currency ?? 'USD',
                quantityTotal: ticket.quantity ?? 0,
                salesStart: ticket.salesStart
                  ? new Date(ticket.salesStart)
                  : null,
                salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd) : null,
                isEarlyBird: ticket.earlyBird ?? false,
                earlyBirdPriceCents:
                  ticket.earlyBird && ticket.earlyBirdPrice
                    ? ticket.earlyBirdPrice
                    : null,
                earlyBirdEndsAt: ticket.earlyBirdEndsAt
                  ? new Date(ticket.earlyBirdEndsAt)
                  : null,
                visible: ticket.displayOnPage ?? true,
                isBchDiscounted: ticket.bchDiscount ?? false,
              },
            });
          }
        }
      }

      return event;
    });

    return respond({ event: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { organizer } = await requireOrganizerContext();
    const existing = await findEvent(context.params.eventIdOrSlug);

    if (!existing || existing.organizerId !== organizer.id) {
      throw new ApiError(404, 'Event not found.');
    }

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: {
        status: EventStatus.ARCHIVED,
        isPublic: false,
      },
    });

    return respond({ event });
  } catch (error) {
    return handleApiError(error);
  }
}
