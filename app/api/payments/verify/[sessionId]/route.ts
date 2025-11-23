import { NextRequest } from 'next/server';

import {
  fetchBalance,
  fetchHistory,
  fetchUnspentTransactionOutputs,
  initializeElectrumClient,
} from '@electrum-cash/protocol';
import { PaymentStatus } from '@prisma/client';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
import {
  calculateCashbackRewardSats,
  createCashbackStamp,
} from '@/lib/payments/cashback';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: { sessionId: string };
}

// HELPER for converting USD cents → sats
// (Replace later with real BCH/USD oracle)
function usdCentsToSatoshis(cents: number, rateUsdPerBch = 250) {
  const usd = cents / 100;
  return Math.floor((usd / rateUsdPerBch) * 1e8);
}

// Simulate verification delay:
const AUTO_CONFIRM_SECONDS = 13;

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { sessionId } = await params;

    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { payment: true },
    });

    if (!session) throw new ApiError(404, 'Session not found');

    const { payment, bchAddress, totalCents } = session;

    const expectedSatoshis = usdCentsToSatoshis(totalCents);

    // 🔹 Electrum calls OUTSIDE transaction (safe)
    /*const electrum = await initializeElectrumClient(
      'payments',
      'bch.imaginary.cash',
    );

    const balance = await fetchBalance(electrum, bchAddress!);
    const utxos = await fetchUnspentTransactionOutputs(electrum, bchAddress!);

    const receivedSatoshis = balance.confirmed + balance.unconfirmed;*/

    // 🔸 Simulation logic
    const createdAt = session.createdAt.getTime();
    const secondsPassed = Math.floor((Date.now() - createdAt) / 1000);
    const shouldConfirm = secondsPassed >= AUTO_CONFIRM_SECONDS;

    let cashback = null;

    if (shouldConfirm && payment?.status !== PaymentStatus.COMPLETED) {
      // 🔹 Short fast transaction (no async inside!)
      const updated = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment!.id },
          data: {
            status: PaymentStatus.COMPLETED,
            bchAmountSats: 20, //receivedSatoshis,
            //txHash: 'yyyy', //utxos[0]?.tx_hash ?? null,
          },
        });

        await tx.checkoutSession.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' },
        });

        return updatedPayment;
      });

      // 🔹 Cashback AFTER transaction (safe)
      cashback = await createCashbackStamp({
        paymentId: updated.id,
        amountSats: BigInt(12),
        organizerId: updated.organizerId,
      });
    }

    return respond({
      sessionId,
      expectedSatoshis,
      receivedSatoshis: 20,
      status: shouldConfirm || 30 >= expectedSatoshis ? 'COMPLETED' : 'PENDING',
      // balance,
      //utxos,
      cashback,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
