import { getCoinbaseSpotPrice } from './coinbase.js';
import { getCryptoPrice } from './coingecko.js';
import { UnifiedMarketQuote } from './types.js';

const COINBASE_PRODUCTS: Record<string, string> = {
  bitcoin: 'BTC-USD',
  ethereum: 'ETH-USD',
};

export async function getCryptoQuote(
  asset: string,
  displayName: string,
  ticker: string,
): Promise<UnifiedMarketQuote> {
  try {
    const c = await getCryptoPrice(ticker);

    return {
      asset,
      displayName,
      price: c.price,
      change24h: c.change24h,
      dayLow: null,
      dayHigh: null,
      volume: c.volume,
      source: c.source,
      timestamp: c.timestamp,
      status: 'live',
    };
  } catch (error) {
    const productId = COINBASE_PRODUCTS[ticker];

    if (!productId) {
      throw error;
    }

    const fallback = await getCoinbaseSpotPrice(productId);

    return {
      asset,
      displayName,
      price: fallback.price,
      change24h: null,
      dayLow: null,
      dayHigh: null,
      volume: null,
      source: `${fallback.source} fallback`,
      timestamp: fallback.timestamp,
      status: 'live',
    };
  }
}
