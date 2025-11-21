import { NextRequest } from 'next/server';

import { CheckoutStatus, EventStatus, Prisma } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkoutSessionSchema } from '@/lib/validators';

const HOLD_WINDOW_MINUTES = 10;

function resolveUnitPrice(ticketType: {
  priceCents: number;
  isEarlyBird: boolean;
  earlyBirdPriceCents: number | null;
  earlyBirdEndsAt: Date | null;
}) {
  if (
    ticketType.isEarlyBird &&
    ticketType.earlyBirdPriceCents &&
    (!ticketType.earlyBirdEndsAt ||
      ticketType.earlyBirdEndsAt >= new Date())
  ) {
    return ticketType.earlyBirdPriceCents;
  }
  return ticketType.priceCents;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = checkoutSessionSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id: payload.eventId },
      include: {
        ticketTypes: true,
      },
    });

    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new ApiError(404, 'Event not available for checkout.');
    }

    const ticketType = event.ticketTypes.find(
      (ticket) => ticket.id === payload.ticketTypeId,
    );

    if (!ticketType || !ticketType.visible) {
      throw new ApiError(404, 'Ticket type not found.');
    }

    const remaining =
      ticketType.quantityTotal - ticketType.quantitySold;
    if (remaining < payload.quantity) {
      throw new ApiError(400, 'Not enough tickets remaining.');
    }

    const unitPriceCents = resolveUnitPrice(ticketType);
    const totalCents = unitPriceCents * payload.quantity;
    const expiresAt = new Date(
      Date.now() + HOLD_WINDOW_MINUTES * 60 * 1000,
    );

    const session = await prisma.checkoutSession.create({
      data: {
        eventId: event.id,
        ticketTypeId: ticketType.id,
        quantity: payload.quantity,
        attendeeName: payload.attendeeName,
        attendeeEmail: payload.attendeeEmail,
        attendeePhone: payload.attendeePhone,
        status: CheckoutStatus.STARTED,
        currency: ticketType.currency,
        unitPriceCents,
        discountCents: 0,
        totalCents,
        expiresAt,
      },
      include: {
        event: true,
        ticketType: true,
        payment: true,
      },
    });

    return respond({ session });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const eventId = params.get('eventId');
    if (!eventId) {
      throw new ApiError(400, 'eventId is required.');
    }

    const { organizer } = await requireOrganizerContext();
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizer.id) {
      throw new ApiError(404, 'Event not found.');
    }

    const sessions = await prisma.checkoutSession.findMany({
      where: { eventId },
      include: {
        ticketType: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return respond({ sessions });
  } catch (error) {
    return handleApiError(error);
  }
}
