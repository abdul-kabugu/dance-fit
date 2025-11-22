import { HDKey } from '@scure/bip32';
import { Wallet } from 'mainnet-js';

import prisma from '@/lib/prisma';

import { toWIF } from '../wif-utils';

// helper shown below

export async function fundCashbackReward(paymentId: string) {
  // 1. Get payment + cashback + organizer
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { cashback: true, organizer: true },
  });

  if (!payment) throw new Error('Payment not found');
  if (!payment.cashback) throw new Error('No cashback linked');
  const cashback = payment.cashback;

  if (cashback.status !== 'UNCLAIMED') {
    throw new Error('Cashback already funded or invalid');
  }

  const organizer = payment.organizer;

  // Todo : decrypt bchXprivEnc  before passing to params
  if (!organizer.bchXprivEnc) {
    throw new Error('Organizer is missing XPRV');
  }

  /*const testBchXprv =  'xprv9xstwgowX2Mzs6iHKozAktvQLyFeU5SK46ZwnJ4xvShZ55hh14VuuPPrX9fnR9tkRt7duoPZwa1twSmfkDFm9vzw2eDSe3pPs61SZsHexYr';*/
  // 2. Restore HD root from XPRV
  const root = HDKey.fromExtendedKey(organizer.bchXprivEnc);

  // 3. Derive child private key for funding
  // You should increase the index per cashback to avoid address reuse.
  const fundingIndex = 0;

  const child = root.derive(`m/0/${fundingIndex}`);

  if (!child.privateKey) {
    throw new Error('Failed to derive child private key');
  }
  console.log(
    `the child pk ${child.privateKey.toString()}  child pubkey : ${child.publicKey}  and the wallet `,
  );

  // 4. Convert child private key -> WIF
  const derivedWif = toWIF(child.privateKey);

  // 5. Restore wallet using WIF
  const wallet = await Wallet.fromWIF(derivedWif);
  console.log('and the cash address is ', wallet.cashaddr);
  // 6. Broadcast funding transaction
  let txId;
  try {
    txId = await wallet.send([
      {
        cashaddr: 'bitcoincash:qq0r5knu9tshp5hgp64dk8z74u7jtmk4svdgxjkry9', //cashback.bchAddress,
        value: 10, //cashback.amountSats,
        unit: 'sats',
      },
    ]);
  } catch (err) {
    console.error('Funding cashback failed:', err);
    throw new Error('Failed to broadcast cashback funding transaction');
  }

  // 7. Save DB updates
  await prisma.cashback.update({
    where: { id: cashback.id },
    data: {
      status: 'CLAIMED',
    },
  });

  return {
    success: true,
    txId,
    fundedTo: 'bitcoincash:qq0r5knu9tshp5hgp64dk8z74u7jtmk4svdgxjkry9', //cashback.bchAddress,
    amount: 20, //cashback.amountSats,
  };
}
