import { getTwelveDataQuote } from './twelveDataShared.js';

export function getIndicesQuote(symbol: string, displayName: string, asset: string) {
  return getTwelveDataQuote(symbol, displayName, asset);
}
