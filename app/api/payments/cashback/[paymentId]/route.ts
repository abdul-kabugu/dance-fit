import type { NextRequest } from 'next/server';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: { paymentId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { paymentId } = await context.params;
    console.log('payments', paymentId);
    if (!paymentId) {
      throw new ApiError(400, 'Payment ID is required.');
    }

    const cashback = await prisma.cashback.findUnique({
      where: { paymentId },
    });

    if (!cashback) {
      throw new ApiError(404, 'Cashback not found for this payment.');
    }

    return respond({ cashback });
  } catch (error) {
    return handleApiError(error);
  }
}
