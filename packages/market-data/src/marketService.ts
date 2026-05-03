import { getCryptoPrice } from './providers/coingecko.js';
import { getFearGreedIndex } from './providers/fearGreed.js';

const ASSET_ALIAS: Record<string, string> = {
  btc: 'bitcoin', bitcoin: 'bitcoin', eth: 'ethereum', ethereum: 'ethereum',
};

export async function getAssetPrice(alias: string) {
  const normalized = alias.toLowerCase();
  if (normalized in ASSET_ALIAS) {
    return getCryptoPrice(ASSET_ALIAS[normalized] as 'bitcoin' | 'ethereum');
  }
  return { asset: alias, price: null, change24h: null, volume: null, source: 'N/A', timestamp: new Date().toISOString() };
}

export async function getMarketPulse() {
  const [btc, eth, fg] = await Promise.all([
    getCryptoPrice('bitcoin'),
    getCryptoPrice('ethereum'),
    getFearGreedIndex(),
  ]);
  const trend = fg.value > 60 ? 'risk-on' : fg.value < 40 ? 'risk-off' : 'neutre';
  return { btc, eth, fearGreed: fg, trend };
}
