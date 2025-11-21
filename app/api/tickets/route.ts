import { NextRequest } from 'next/server';

import { Prisma, TicketStatus } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import { requireOrganizerContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { issueTicket } from '@/lib/services/tickets';
import { ticketIssueSchema } from '@/lib/validators';

const DEFAULT_LIMIT = 25;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const eventId = params.get('eventId') ?? undefined;
    const attendeeEmail = params.get('email') ?? undefined;
    const organizerParam = params.get('organizer') ?? undefined;
    const limit = Number.parseInt(params.get('limit') ?? '', 10);

    const where: Prisma.TicketWhereInput = {};

    if (eventId) where.eventId = eventId;
    if (attendeeEmail)
      where.attendeeEmail = { equals: attendeeEmail, mode: 'insensitive' };

    if (organizerParam === 'me') {
      const { organizer } = await requireOrganizerContext();
      where.organizerId = organizer.id;
    } else if (organizerParam) {
      where.organizerId = organizerParam;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        ticketType: true,
        event: true,
        payment: true,
        nftTicket: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isNaN(limit) ? DEFAULT_LIMIT : limit,
    });

    return respond({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = ticketIssueSchema.parse(body);
    const { organizer } = await requireOrganizerContext();

    const event = await prisma.event.findUnique({
      where: { id: payload.eventId },
      select: { id: true, organizerId: true },
    });

    if (!event || event.organizerId !== organizer.id) {
      throw new ApiError(404, 'Event not found.');
    }

    const status = payload.status
      ? (TicketStatus[
          payload.status as keyof typeof TicketStatus
        ] as TicketStatus)
      : undefined;

    if (payload.mintNft && !payload.nftWalletAddress) {
      throw new ApiError(
        400,
        'A wallet address is required to mint the NFT ticket.',
      );
    }

    const nftDetails =
      payload.mintNft && payload.nftWalletAddress
        ? {
            walletAddress: payload.nftWalletAddress,
            tokenId: payload.nftTokenId ?? `0x${randomUUID().replace(/-/g, '')}`,
          }
        : undefined;

    const ticket = await issueTicket({
      ticketTypeId: payload.ticketTypeId,
      eventId: payload.eventId,
      organizerId: organizer.id,
      attendeeName: payload.attendeeName,
      attendeeEmail: payload.attendeeEmail,
      attendeePhone: payload.attendeePhone,
      paymentId: payload.paymentId ?? null,
      status,
      referenceCode: payload.referenceCode,
      nftDetails,
      cashbackAmountSats: payload.cashbackAmountSats,
    });

    return respond({ ticket }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
import { randomUUID } from 'crypto';
