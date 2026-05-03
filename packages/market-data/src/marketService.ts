import { getCryptoPrice } from './providers/coingecko.js';
import { getFearGreedIndex } from './providers/fearGreed.js';
import { getUnifiedQuote } from './providers/resolver.js';

export async function getAssetPrice(alias: string) {
  return getUnifiedQuote(alias);
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
