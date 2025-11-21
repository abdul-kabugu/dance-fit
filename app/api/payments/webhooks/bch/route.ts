import { randomBytes } from 'crypto';

import { NextRequest } from 'next/server';

import {
  CheckoutStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { issueTicket } from '@/lib/services/tickets';
import { bchWebhookSchema } from '@/lib/validators';

const CASHBACK_PERCENT =
  Number.parseFloat(process.env.CASHBACK_PERCENT ?? '5') / 100;

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.BCH_WEBHOOK_SECRET;
    if (webhookSecret) {
      const header = request.headers.get('x-webhook-secret');
      if (header !== webhookSecret) {
        throw new ApiError(401, 'Invalid webhook signature.');
      }
    }

    const body = await request.json();
    const payload = bchWebhookSchema.parse(body);

    const checkout = await prisma.checkoutSession.findUnique({
      where: { id: payload.checkoutSessionId },
      include: {
        event: true,
        ticketType: true,
        payment: true,
      },
    });

    if (!checkout || !checkout.paymentId || !checkout.payment) {
      throw new ApiError(404, 'Checkout session payment not found.');
    }

    if (checkout.payment.method !== PaymentMethod.BCH) {
      throw new ApiError(400, 'Only BCH payments can trigger this webhook.');
    }

    if (checkout.payment.status === PaymentStatus.COMPLETED) {
      return respond({ ok: true });
    }

    const cashbackAmount = Math.round(
      payload.amountSats * Math.max(CASHBACK_PERCENT, 0),
    );

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: checkout.paymentId! },
        data: {
          status: PaymentStatus.COMPLETED,
          txHash: payload.txHash,
          bchAmountSats: payload.amountSats,
        },
      });

      const session = await tx.checkoutSession.update({
        where: { id: checkout.id },
        data: {
          status: CheckoutStatus.COMPLETED,
        },
      });

      const ticket = await issueTicket(
        {
          ticketTypeId: checkout.ticketTypeId,
          eventId: checkout.eventId,
          organizerId: checkout.event.organizerId,
          attendeeName: checkout.attendeeName,
          attendeeEmail: checkout.attendeeEmail,
          attendeePhone: checkout.attendeePhone ?? undefined,
          paymentId: payment.id,
          nftDetails: {
            walletAddress: payload.fromAddress,
            tokenId: `0x${randomBytes(32).toString('hex')}`,
          },
          cashbackAmountSats: cashbackAmount || undefined,
        },
        tx,
      );

      return { payment, session, ticket };
    });

    return respond(result);
  } catch (error) {
    return handleApiError(error);
  }
}
