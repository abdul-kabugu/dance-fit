import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Convert USD → BCH using live CoinGecko price.
 * @param amountUsd number e.g. 12.50
 */
export async function getBchQuote(amountUsd: number) {
  const { data } = await axios.get(`${COINGECKO_API}/simple/price`, {
    params: {
      ids: 'bitcoin-cash',
      vs_currencies: 'usd',
    },
  });

  const usdPerBch = data?.['bitcoin-cash']?.usd;

  if (!usdPerBch || typeof usdPerBch !== 'number') {
    throw new Error('Failed to fetch BCH price.');
  }

  const bchAmount = amountUsd / usdPerBch;

  return {
    usd: amountUsd,
    bch: bchAmount, // decimal BCH
    sats: Math.round(bchAmount * 1e8),
    usdPerBch, // price reference
  };
}

export function formatBchSmart(amount: number) {
  if (amount >= 1) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  if (amount >= 0.00001) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8,
    });
  }

  // Convert tiny BCH → sats
  const sats = Math.round(amount * 1e8);
  return `${sats.toLocaleString('en-US')} sats`;
}
