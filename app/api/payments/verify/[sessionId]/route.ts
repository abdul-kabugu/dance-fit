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
    console.log('The session Id', sessionId);

    // 1. Fetch checkout session
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        payment: true,
      },
    });
    //
    if (!session) throw new ApiError(404, 'Checkout session not found.');

    const { bchAddress, totalCents, payment } = session;

    if (!bchAddress)
      throw new ApiError(400, 'Missing BCH address for session.');

    // 2. Convert expected fiat price → BCH amount
    const expectedSatoshis = usdCentsToSatoshis(totalCents);

    // 3. Connect to Electrum server
    const electrum = await initializeElectrumClient(
      'DanceFit Payment Verify',
      'bch.imaginary.cash',
    );

    // 4. Query Electrum: balance, UTXOs, history
    const balance = await fetchBalance(electrum, bchAddress);
    const utxos = await fetchUnspentTransactionOutputs(electrum, bchAddress);
    const history = await fetchHistory(electrum, bchAddress);

    const receivedSatoshis = balance.confirmed + balance.unconfirmed;
    const isPaid = receivedSatoshis >= expectedSatoshis;

    // -----------SIMULATION---------

    // Simulate a delay before confirming payment
    const createdAt = session.createdAt.getTime();
    const now = Date.now();

    const secondsPassed = Math.floor((now - createdAt) / 1000);

    const shouldConfirm = secondsPassed >= AUTO_CONFIRM_SECONDS;
    // 5. If paid → update DB
    // isPaid && payment &&
    if (shouldConfirm && payment?.status !== PaymentStatus.COMPLETED) {
      await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment?.id },
          data: {
            status: PaymentStatus.COMPLETED,
            bchAmountSats: receivedSatoshis,
            txHash: utxos[0]?.tx_hash ?? null,
          },
          select: {
            id: true,
            organizerId: true,
          },
        });

        await tx.checkoutSession.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' },
        });

        const cashbackAmount = 12; //calculateCashbackRewardSats(receivedSatoshis);
        if (cashbackAmount > 0) {
          await createCashbackStamp(
            {
              paymentId: updatedPayment.id,
              amountSats: BigInt(cashbackAmount),
              organizerId: updatedPayment.organizerId,
            },
            tx,
          );
        }
      });
    }

    return respond({
      sessionId,
      bchAddress,
      expectedSatoshis,
      receivedSatoshis,
      status: isPaid ? 'COMPLETED' : 'PENDING',
      balance,
      utxos,
      history,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
