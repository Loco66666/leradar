import { resolveMarketSymbol } from '../marketSymbolMap.js';
import { getCryptoQuote } from './crypto.js';
import { getTwelveDataQuote } from './twelveData.js';
import { UnifiedMarketQuote } from './types.js';

export async function getUnifiedQuote(asset: string): Promise<UnifiedMarketQuote | null> {
  const symbol = resolveMarketSymbol(asset);
  if (!symbol) return null;

  if (symbol.kind === 'crypto') {
    return getCryptoQuote(symbol.key, symbol.displayName, symbol.ticker);
  }

  return getTwelveDataQuote(symbol.key, symbol.displayName, symbol.ticker);
}
