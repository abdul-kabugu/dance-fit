import type { NextRequest } from 'next/server';

import { CheckoutStatus } from '@prisma/client';
import { z } from 'zod';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';

const statusSchema = z.object({
  status: z.nativeEnum(CheckoutStatus),
});

interface RouteContext {
  params: { sessionId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params; // 🔥 FIX HERE
    const sessionId = params.sessionId;
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          include: {
            organizer: true,
            artists: {
              include: {
                artist: {
                  include: { user: true },
                },
              },
            },
          },
        },
        ticketType: true,
        payment: {
          include: {
            ticket: {
              include: {
                ticketType: true,
                event: true,
                nftTicket: true,
              },
            },
            cashback: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, 'Checkout session not found.');
    }

    return respond({ session });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { organizer } = await requireOrganizerContext();
    const session = await prisma.checkoutSession.findUnique({
      where: { id: context.params.sessionId },
      include: { event: true },
    });

    if (!session || session.event.organizerId !== organizer.id) {
      throw new ApiError(404, 'Checkout session not found.');
    }

    const body = await request.json();
    const payload = statusSchema.parse(body);

    const updated = await prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: payload.status },
    });

    return respond({ session: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
