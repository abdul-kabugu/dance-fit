import { NextRequest } from 'next/server';

import { CheckoutStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { paymentSessionSchema } from '@/lib/validators';

const BCH_DISCOUNT_PERCENT =
  Number.parseFloat(process.env.BCH_DISCOUNT_PERCENT ?? '10') / 100;
const BCH_USD_PRICE = Number.parseFloat(process.env.BCH_USD_PRICE ?? '250');

function makeBchAddress() {
  return `bitcoincash:qq${randomBytes(32).toString('hex').slice(0, 38)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = paymentSessionSchema.parse(body);

    const checkout = await prisma.checkoutSession.findUnique({
      where: { id: payload.checkoutSessionId },
      include: {
        event: true,
        ticketType: true,
        payment: true,
      },
    });

    if (!checkout) {
      throw new ApiError(404, 'Checkout session not found.');
    }

    /*if (
      checkout.expiresAt &&
      checkout.expiresAt.getTime() < Date.now() &&
      checkout.status !== CheckoutStatus.COMPLETED
    ) {
      throw new ApiError(410, 'Checkout session has expired.');
    }*/

    if (checkout.payment && checkout.payment.method === payload.method) {
      return respond({
        session: checkout,
        payment: checkout.payment,
      });
    }

    if (payload.method !== PaymentMethod.BCH) {
      throw new ApiError(400, 'Only BCH payments are supported right now.');
    }

    const baseTotal = checkout.unitPriceCents * checkout.quantity;
    const discountCents =
      checkout.ticketType.isBchDiscounted && BCH_DISCOUNT_PERCENT > 0
        ? Math.round(baseTotal * BCH_DISCOUNT_PERCENT)
        : 0;
    const totalCents = baseTotal - discountCents;
    const usdAmount = totalCents / 100;
    const bchAmount =
      BCH_USD_PRICE > 0 ? usdAmount / BCH_USD_PRICE : usdAmount / 200;
    const bchAmountSats = Math.max(1, Math.round(bchAmount * 1e8));
    const bchAddress = makeBchAddress();

    const payment = await prisma.payment.create({
      data: {
        eventId: checkout.eventId,
        organizerId: checkout.event.organizerId,
        method: payload.method,
        status: PaymentStatus.PENDING,
        amountCents: totalCents,
        currency: checkout.currency,
        bchAmountSats,
        bchAddress,
      },
    });

    const updatedSession = await prisma.checkoutSession.update({
      where: { id: checkout.id },
      data: {
        paymentId: payment.id,
        paymentMethod: payload.method,
        discountCents,
        totalCents,
        status: CheckoutStatus.AWAITING_PAYMENT,
        bchAddress,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      include: {
        event: true,
        ticketType: true,
        payment: true,
      },
    });

    return respond({
      session: updatedSession,
      payment,
      quote: {
        amountSats: bchAmountSats,
        usdCents: totalCents,
        discountCents,
        address: bchAddress,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
