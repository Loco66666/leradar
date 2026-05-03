import { getTwelveDataQuote } from './twelveDataShared.js';

export function getMacroQuote(symbol: string, displayName: string, asset: string) {
  return getTwelveDataQuote(symbol, displayName, asset);
}
