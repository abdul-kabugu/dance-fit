// lib/cashback.ts
import type { Cashback, Prisma, PrismaClient } from '@prisma/client';
import { CashbackStatus } from '@prisma/client';
import { Wallet } from 'mainnet-js';

import prisma from '@/lib/prisma';

const RAW_CASHBACK_PERCENT =
  Number.parseFloat(process.env.CASHBACK_PERCENT ?? '5') / 100;
const CASHBACK_PERCENT =
  Number.isFinite(RAW_CASHBACK_PERCENT) && RAW_CASHBACK_PERCENT > 0
    ? RAW_CASHBACK_PERCENT
    : 0;

type DbClient = Prisma.TransactionClient | PrismaClient;
type CreateCashbackParams = {
  paymentId: string;
  amountSats: bigint;
  organizerId: string;
};

export function calculateCashbackRewardSats(
  paymentAmountSats: number | null | undefined,
) {
  if (!paymentAmountSats || paymentAmountSats <= 0 || CASHBACK_PERCENT <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(paymentAmountSats * CASHBACK_PERCENT));
}

type CashbackWalletPreview = {
  cashbackAddress: string;
  cashbackWif: string;
};

/**
 * Generate a single-use cashback wallet + optionally persist it.
 *
 * This matches the "CashStamp = paper wallet" idea:
 *  1. Generate a random wallet
 *  2. Use its cashaddr as the stamp address
 *  3. Store the WIF (private key) securely on our side
 */
export async function createCashbackStamp(): Promise<CashbackWalletPreview>;
export async function createCashbackStamp(
  params: CreateCashbackParams,
  tx?: DbClient,
): Promise<Cashback>;
export async function createCashbackStamp(
  params?: CreateCashbackParams,
  tx?: DbClient,
): Promise<Cashback | CashbackWalletPreview> {
  // 🔹 1) Create a brand new BCH wallet (random)
  const wallet = await Wallet.newRandom();

  // 🔹 2) Extract address and WIF from mainnet-js
  //     NOTE: these come straight from official docs:
  //     - wallet.cashaddr      (deposit address)
  //     - wallet.privateKeyWif (WIF string for recovery/spend)
  const cashbackAddress = wallet.cashaddr;
  const cashbackWif = wallet.privateKeyWif; // ⭐ WIF comes from here

  if (!params) {
    return { cashbackAddress, cashbackWif };
  }

  const client = tx ?? prisma;
  const existing = await client.cashback.findUnique({
    where: { paymentId: params.paymentId },
  });
  if (existing) {
    return existing;
  }

  // TODO:  ENCRYPT cashbackWif before saving

  // 🔹 3) Persist cashback stamp in DB
  return client.cashback.create({
    data: {
      paymentId: params.paymentId,
      organizerId: params.organizerId,
      amountSats: Number(params.amountSats),
      bchAddress: cashbackAddress,
      wifEncrypted: cashbackWif,
      status: CashbackStatus.UNCLAIMED,
    },
  });
}
