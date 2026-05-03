import { UnifiedMarketQuote } from './types.js';

export async function getTwelveDataQuote(symbol: string, displayName: string, asset: string): Promise<UnifiedMarketQuote> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return {
      asset,
      displayName,
      price: null,
      change24h: null,
      dayLow: null,
      dayHigh: null,
      volume: null,
      source: 'Twelve Data',
      timestamp: new Date().toISOString(),
      status: 'unavailable',
      note: 'TWELVE_DATA_API_KEY non configurée.',
    };
  }

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TwelveData HTTP ${response.status}`);
  const data = (await response.json()) as Record<string, string>;
  if (data.status === 'error') throw new Error(`TwelveData: ${data.message ?? 'Erreur inconnue'}`);

  return {
    asset,
    displayName,
    price: Number(data.close ?? NaN),
    change24h: Number(data.percent_change ?? NaN),
    dayLow: Number(data.low ?? NaN),
    dayHigh: Number(data.high ?? NaN),
    volume: Number(data.volume ?? NaN),
    source: 'Twelve Data',
    timestamp: new Date().toISOString(),
    status: 'live',
  };
}
