import { resolveMarketSymbol } from '../marketSymbolMap.js';
import { getCryptoPrice } from './coingecko.js';
import { getForexQuote } from './forex.js';
import { getIndicesQuote } from './indices.js';
import { getMacroQuote } from './macro.js';
import { getMetalsQuote } from './metals.js';
import { UnifiedMarketQuote } from './types.js';

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
      status: 'live',
    };
  }

  if (symbol.kind === 'forex') return getForexQuote(symbol.ticker, symbol.displayName);
  if (symbol.kind === 'metals') return getMetalsQuote(symbol.ticker, symbol.displayName, symbol.key);
  if (symbol.kind === 'indices') return getIndicesQuote(symbol.ticker, symbol.displayName, symbol.key);
  return getMacroQuote(symbol.ticker, symbol.displayName, symbol.key);
}
