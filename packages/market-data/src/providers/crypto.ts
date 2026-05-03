import { getCryptoPrice } from './coingecko.js';
import { UnifiedMarketQuote } from './types.js';

export async function getCryptoQuote(
  asset: string,
  displayName: string,
  ticker: string,
): Promise<UnifiedMarketQuote> {
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
}
