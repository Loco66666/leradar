import { resolveMarketSymbol } from '../marketSymbolMap.js';
import { getCryptoPrice } from './coingecko.js';
import { getYahooQuote, UnifiedMarketQuote } from './yahoo.js';

export async function getUnifiedQuote(asset: string): Promise<UnifiedMarketQuote | null> {
  const symbol = resolveMarketSymbol(asset);
  if (!symbol) return null;

  if (symbol.kind === 'crypto') {
    const c = await getCryptoPrice(symbol.ticker as 'bitcoin' | 'ethereum' | 'solana' | 'binancecoin' | 'ripple');
    return {
      asset: symbol.key,
      displayName: symbol.displayName,
      price: c.price,
      change24h: c.change24h,
      dayLow: null,
      dayHigh: null,
      volume: c.volume,
      source: c.source,
      timestamp: c.timestamp,
    };
  }

  return getYahooQuote(symbol.ticker, symbol.displayName);
}
