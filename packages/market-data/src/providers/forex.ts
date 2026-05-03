import { UnifiedMarketQuote } from './types.js';

export async function getForexQuote(pair: string, displayName: string): Promise<UnifiedMarketQuote> {
  const [base, quote] = pair.split('/');
  const url = `https://api.frankfurter.app/latest?from=${base}&to=${quote}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);
  const data = (await response.json()) as { rates?: Record<string, number> };
  const price = data.rates?.[quote] ?? null;
  return {
    asset: pair.replace('/', '').toLowerCase(),
    displayName,
    price,
    change24h: null,
    dayLow: null,
    dayHigh: null,
    volume: null,
    source: 'Frankfurter',
    timestamp: new Date().toISOString(),
    status: price ? 'delayed' : 'unavailable',
    note: 'Variation intrajournalière indisponible sur source gratuite sans clé.',
  };
}
