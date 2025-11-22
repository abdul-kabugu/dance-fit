import type { NextRequest } from 'next/server';

import { PaymentStatus } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { issueTicket } from '@/lib/services/tickets';

interface RouteContext {
  params: { sessionId: string };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    ///
    const params = await context.params; // 🔥 FIX HERE
    const sessionId = params.sessionId;
    console.log('session id is', sessionId);
    if (!sessionId) {
      throw new ApiError(400, 'Checkout session ID is required.');
    }
    //
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        event: true,
        ticketType: true,
        payment: {
          include: {
            ticket: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, 'Checkout session not found.');
    }

    if (!session.payment) {
      throw new ApiError(400, 'No payment found for this session.');
    }

    if (session.payment.status !== PaymentStatus.COMPLETED) {
      throw new ApiError(
        400,
        'Payment must be completed before issuing a ticket.',
      );
    }

    if (session.payment.ticket) {
      return respond({ ticket: session.payment.ticket });
    }

    const ticket = await issueTicket({
      ticketTypeId: session.ticketTypeId,
      eventId: session.eventId,
      organizerId: session.event.organizerId,
      attendeeName: session.attendeeName,
      attendeeEmail: session.attendeeEmail,
      attendeePhone: session.attendeePhone ?? undefined,
      paymentId: session.payment.id,
    });

    return respond({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}
