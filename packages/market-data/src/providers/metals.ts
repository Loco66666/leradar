import { getStooqDailySeries } from './stooq.js';
import { UnifiedMarketQuote } from './types.js';

export async function getMetalsQuote(asset: string, displayName: string, symbol: string): Promise<UnifiedMarketQuote | null> {
  const points = await getStooqDailySeries(symbol);
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  if (!last?.close) return null;
  return {
    asset,
    displayName,
    price: last.close,
    change24h: prev?.close ? ((last.close - prev.close) / prev.close) * 100 : null,
    dayLow: last.low,
    dayHigh: last.high,
    volume: last.volume,
    source: 'Stooq',
    timestamp: new Date().toISOString(),
    status: 'delayed',
  };
}
