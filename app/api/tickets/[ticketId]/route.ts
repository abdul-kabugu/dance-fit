import type { NextRequest } from 'next/server';

import { TicketStatus } from '@prisma/client';
import { z } from 'zod';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';

const statusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

interface RouteContext {
  params: { ticketId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { organizer } = await requireOrganizerContext();
    const ticket = await prisma.ticket.findUnique({
      where: { id: context.params.ticketId },
      include: {
        ticketType: true,
        event: true,
        payment: true,
        nftTicket: true,
      },
    });

    if (!ticket || ticket.organizerId !== organizer.id) {
      throw new ApiError(404, 'Ticket not found.');
    }

    return respond({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { organizer } = await requireOrganizerContext();
    const ticket = await prisma.ticket.findUnique({
      where: { id: context.params.ticketId },
    });

    if (!ticket || ticket.organizerId !== organizer.id) {
      throw new ApiError(404, 'Ticket not found.');
    }

    const body = await request.json();
    const payload = statusSchema.parse(body);

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: payload.status },
    });

    return respond({ ticket: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { organizer } = await requireOrganizerContext();
    const ticket = await prisma.ticket.findUnique({
      where: { id: context.params.ticketId },
    });

    if (!ticket || ticket.organizerId !== organizer.id) {
      throw new ApiError(404, 'Ticket not found.');
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.CANCELLED },
    });

    return respond({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
