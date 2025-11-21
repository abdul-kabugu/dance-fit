import type { NextRequest } from 'next/server';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

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
      throw new ApiError(404, 'Payment session not found.');
    }

    return respond({ session });
  } catch (error) {
    return handleApiError(error);
  }
}
