import { resolveAsset } from '../assetRegistry.js';
import { isProviderCoolingDown, markProviderFailure, markProviderSuccess } from '../providerHealth.js';
import { getFreshCachedQuote, getStaleFallbackQuote, setCachedQuote } from '../quoteCache.js';
import { getCryptoQuote } from './crypto.js';
import { getFmpIndexQuote } from './fmp.js';
import { getFmpCommodityQuote } from './fmpCommodities.js';
import { getTwelveDataQuote } from './twelveData.js';
import { UnifiedMarketQuote } from './types.js';

type ResolvedAsset = NonNullable<ReturnType<typeof resolveAsset>>;

async function fetchProviderQuote(asset: ResolvedAsset): Promise<UnifiedMarketQuote> {
  if (asset.provider === 'coingecko') {
    return getCryptoQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  if (asset.provider === 'fmp') {
    return getFmpIndexQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  if (asset.provider === 'fmpCommodity') {
    return getFmpCommodityQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  if (asset.provider === 'twelveData') {
    return getTwelveDataQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  throw new Error(`Provider non supporté pour ${asset.id}: ${asset.provider}`);
}

export async function getUnifiedQuote(assetInput: string): Promise<UnifiedMarketQuote | null> {
  const asset = resolveAsset(assetInput);

  if (!asset) return null;

  const freshCache = getFreshCachedQuote(asset.id, asset.category);

  if (freshCache) {
    return freshCache;
  }

  const staleFallback = getStaleFallbackQuote(asset.id);

  if (isProviderCoolingDown(asset.provider)) {
    if (staleFallback) {
      return staleFallback;
    }

    throw new Error(`Provider temporairement en pause pour ${asset.id}: ${asset.provider}`);
  }

  try {
    const quote = await fetchProviderQuote(asset);
    setCachedQuote(asset.id, quote);
    markProviderSuccess(asset.provider);
    return quote;
  } catch (error) {
    markProviderFailure(asset.provider);

    if (staleFallback) {
      return staleFallback;
    }

    throw error;
  }
}
