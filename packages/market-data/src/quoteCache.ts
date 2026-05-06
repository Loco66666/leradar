import { AssetCategory } from './assetRegistry.js';
import { UnifiedMarketQuote } from './providers/types.js';

type CacheEntry = {
  quote: UnifiedMarketQuote;
  cachedAt: number;
};

const quoteCache = new Map<string, CacheEntry>();

const TTL_BY_CATEGORY: Record<AssetCategory, number> = {
  crypto: 60 * 1000,
  forex: 120 * 1000,
  metals: 180 * 1000,
  commodities: 180 * 1000,
  indices: 180 * 1000,
  stocks: 300 * 1000,
  etf: 300 * 1000,
};

const STALE_FALLBACK_MAX_AGE_MS = 30 * 60 * 1000;

function cloneQuote(quote: UnifiedMarketQuote): UnifiedMarketQuote {
  return { ...quote };
}

export function getFreshCachedQuote(
  assetId: string,
  category: AssetCategory,
): UnifiedMarketQuote | null {
  const entry = quoteCache.get(assetId);

  if (!entry) return null;

  const ttl = TTL_BY_CATEGORY[category];
  const age = Date.now() - entry.cachedAt;

  if (age > ttl) return null;

  return cloneQuote(entry.quote);
}

export function setCachedQuote(assetId: string, quote: UnifiedMarketQuote): void {
  if (quote.price === null || quote.status === 'unavailable') return;

  quoteCache.set(assetId, {
    quote: cloneQuote(quote),
    cachedAt: Date.now(),
  });
}

export function getStaleFallbackQuote(assetId: string): UnifiedMarketQuote | null {
  const entry = quoteCache.get(assetId);

  if (!entry) return null;

  const age = Date.now() - entry.cachedAt;

  if (age > STALE_FALLBACK_MAX_AGE_MS) return null;

  return {
    ...cloneQuote(entry.quote),
    source: `${entry.quote.source} • cache de secours`,
    status: entry.quote.status === 'live' ? 'delayed' : entry.quote.status,
    timestamp: entry.quote.timestamp,
  };
}

export function clearQuoteCache(): void {
  quoteCache.clear();
}

export function getQuoteCacheSize(): number {
  return quoteCache.size;
}
