import { NextRequest, NextResponse } from 'next/server';

import {
  fetchBalance,
  fetchHistory,
  fetchUnspentTransactionOutputs,
  initializeElectrumClient,
} from '@electrum-cash/protocol';

import { ApiError, handleApiError, respond } from '@/lib/api-helpers';
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

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { sessionId } = params;

    // 1. Fetch checkout session
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        payment: true,
      },
    });

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

    // 5. If paid → update DB
    if (isPaid && payment) {
      // Update Payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          bchAmountSats: receivedSatoshis,
          txHash: utxos[0]?.tx_hash ?? null,
        },
      });

      // Update CheckoutSession record
      await prisma.checkoutSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' },
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
