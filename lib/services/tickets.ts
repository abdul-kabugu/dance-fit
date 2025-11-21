import { Prisma, TicketStatus } from '@prisma/client';

import { ApiError } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { generateReference } from '@/lib/strings';

type TxClient = Prisma.TransactionClient;

interface IssueTicketInput {
  ticketTypeId: string;
  eventId: string;
  organizerId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  paymentId?: string | null;
  status?: TicketStatus;
  referenceCode?: string;
  nftDetails?: {
    walletAddress: string;
    tokenId: string;
  };
  cashbackAmountSats?: number;
}

export async function issueTicket(
  params: IssueTicketInput,
  tx?: TxClient,
) {
  const client = tx ?? prisma;

  const ticketType = await client.ticketType.findUnique({
    where: { id: params.ticketTypeId },
    select: {
      id: true,
      eventId: true,
      quantitySold: true,
      quantityTotal: true,
      event: {
        select: {
          organizerId: true,
        },
      },
    },
  });

  if (!ticketType || ticketType.eventId !== params.eventId) {
    throw new ApiError(404, 'Ticket type not found for this event.');
  }

  if (ticketType.event.organizerId !== params.organizerId) {
    throw new ApiError(403, 'You cannot issue tickets for another organizer.');
  }

  if (ticketType.quantitySold >= ticketType.quantityTotal) {
    throw new ApiError(400, 'This ticket type is sold out.');
  }

  const ticket = await client.ticket.create({
    data: {
      eventId: params.eventId,
      organizerId: params.organizerId,
      ticketTypeId: params.ticketTypeId,
      attendeeName: params.attendeeName,
      attendeeEmail: params.attendeeEmail,
      attendeePhone: params.attendeePhone,
      paymentId: params.paymentId ?? null,
      status: params.status ?? TicketStatus.CONFIRMED,
      referenceCode: params.referenceCode ?? generateReference('DFIT'),
    },
  });

  await client.ticketType.update({
    where: { id: params.ticketTypeId },
    data: {
      quantitySold: { increment: 1 },
    },
  });

  if (params.nftDetails) {
    await client.nftTicket.create({
      data: {
        ticketId: ticket.id,
        walletAddress: params.nftDetails.walletAddress,
        tokenId: params.nftDetails.tokenId,
      },
    });
  }

  if (params.cashbackAmountSats) {
    if (!params.paymentId) {
      throw new ApiError(
        400,
        'Cashback issuance requires a linked payment record.',
      );
    }
    await client.cashback.create({
      data: {
        paymentId: params.paymentId,
        amountSats: params.cashbackAmountSats,
      },
    });
  }

  return client.ticket.findUnique({
    where: { id: ticket.id },
    include: {
      ticketType: true,
      event: true,
      payment: true,
      nftTicket: true,
    },
  });
}
