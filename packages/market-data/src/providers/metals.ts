import { getTwelveDataQuote } from './twelveDataShared.js';

export function getMetalsQuote(symbol: string, displayName: string, asset: string) {
  return getTwelveDataQuote(symbol, displayName, asset);
}
