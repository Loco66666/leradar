import { resolveAsset } from '../assetRegistry.js';
import { getCryptoQuote } from './crypto.js';
import { getFmpIndexQuote } from './fmp.js';
import { getTwelveDataQuote } from './twelveData.js';
import { UnifiedMarketQuote } from './types.js';

export async function getUnifiedQuote(assetInput: string): Promise<UnifiedMarketQuote | null> {
  const asset = resolveAsset(assetInput);

  if (!asset) return null;

  if (asset.provider === 'coingecko') {
    return getCryptoQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  if (asset.provider === 'fmp') {
    return getFmpIndexQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  if (asset.provider === 'twelveData') {
    return getTwelveDataQuote(asset.id, asset.displayName, asset.providerSymbol);
  }

  throw new Error(`Provider non supporté pour ${asset.id}: ${asset.provider}`);
}
