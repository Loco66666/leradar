import { UnifiedMarketQuote } from './types.js';

export async function getForexQuote(asset: string, displayName: string, pair: string): Promise<UnifiedMarketQuote | null> {
  const base = pair.slice(0, 3).toUpperCase();
  const quote = pair.slice(3, 6).toUpperCase();

  const latestResp = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
  if (!latestResp.ok) return null;
  const latest = (await latestResp.json()) as { date?: string; rates?: Record<string, number> };
  const price = latest.rates?.[quote] ?? null;
  if (price === null) return null;

  const histResp = await fetch(`https://api.frankfurter.app/2024-01-01..?from=${base}&to=${quote}`);
  let change24h: number | null = null;
  if (histResp.ok) {
    const hist = (await histResp.json()) as { rates?: Record<string, Record<string, number>> };
    const values = Object.values(hist.rates ?? {}).map((r) => r[quote]).filter((v): v is number => typeof v === 'number');
    if (values.length >= 2) {
      const prev = values[values.length - 2];
      change24h = prev > 0 ? ((price - prev) / prev) * 100 : null;
    }
  }

  return {
    asset,
    displayName,
    price,
    change24h,
    dayLow: null,
    dayHigh: null,
    volume: null,
    source: 'Frankfurter',
    timestamp: new Date().toISOString(),
    status: 'delayed',
  };
}
