import { resolveMarketSymbol } from '../marketSymbolMap.js';
import { getCryptoQuote } from './crypto.js';
import { getForexQuote } from './forex.js';
import { getIndexQuote } from './indices.js';
import { getMetalsQuote } from './metals.js';
import { UnifiedMarketQuote } from './types.js';

export async function getUnifiedQuote(asset: string): Promise<UnifiedMarketQuote | null> {
  const symbol = resolveMarketSymbol(asset);
  if (!symbol) return null;

  if (symbol.kind === 'crypto') {
    return getCryptoQuote(symbol.key, symbol.displayName, symbol.ticker);
  }

  if (symbol.kind === 'forex') {
    return getForexQuote(symbol.key, symbol.displayName, symbol.ticker);
  }

  if (symbol.kind === 'metals') {
    return getMetalsQuote(symbol.key, symbol.displayName, symbol.ticker);
  }

  return getIndexQuote(symbol.key, symbol.displayName, symbol.ticker);
}
