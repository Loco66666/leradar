import { UnifiedMarketQuote } from './types.js';

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

function isMarketClosed(): boolean {
  const day = new Date().getUTCDay();

  if (day === 0 || day === 6) return true;

  return false;
}

export async function getFinnhubQuote(
  asset: string,
  displayName: string,
  symbol: string,
): Promise<UnifiedMarketQuote> {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY manquant');
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Donnée Finnhub indisponible pour ${symbol}: HTTP ${response.status}`);
  }

  let payload: FinnhubQuote;

  try {
    payload = JSON.parse(text) as FinnhubQuote;
  } catch {
    throw new Error(`Réponse Finnhub non JSON pour ${symbol}`);
  }

  if (typeof payload.c !== 'number' || !Number.isFinite(payload.c) || payload.c <= 0) {
    throw new Error(`Prix Finnhub invalide pour ${symbol}`);
  }

  return {
    asset,
    displayName,
    price: payload.c,
    change24h: typeof payload.dp === 'number' && Number.isFinite(payload.dp) ? payload.dp : null,
    dayLow: typeof payload.l === 'number' && Number.isFinite(payload.l) ? payload.l : null,
    dayHigh: typeof payload.h === 'number' && Number.isFinite(payload.h) ? payload.h : null,
    volume: null,
    source: `Finnhub (${symbol})`,
    timestamp: payload.t ? new Date(payload.t * 1000).toISOString() : new Date().toISOString(),
    status: isMarketClosed() ? 'closed' : 'delayed',
  };
}
