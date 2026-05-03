import { UnifiedMarketQuote } from './types.js';

type FmpQuote = {
  symbol?: string;
  name?: string;
  price?: number;
  changePercentage?: number;
  volume?: number;
  dayLow?: number;
  dayHigh?: number;
  timestamp?: number;
};

function isWeekendClosed(): boolean {
  const day = new Date().getUTCDay();
  return day === 0 || day === 6;
}

export async function getFmpIndexQuote(
  asset: string,
  displayName: string,
  symbol: string,
): Promise<UnifiedMarketQuote> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    throw new Error('FMP_API_KEY manquant');
  }

  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  const text = await response.text();

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Réponse FMP non JSON pour ${symbol}`);
  }

  if (!response.ok || !Array.isArray(payload) || !payload[0]) {
    throw new Error(`Donnée FMP indisponible pour ${symbol}`);
  }

  const q = payload[0] as FmpQuote;

  if (typeof q.price !== 'number' || !Number.isFinite(q.price) || q.price <= 0) {
    throw new Error(`Prix FMP invalide pour ${symbol}`);
  }

  return {
    asset,
    displayName: q.name ?? displayName,
    price: q.price,
    change24h: typeof q.changePercentage === 'number' ? q.changePercentage : null,
    dayLow: typeof q.dayLow === 'number' ? q.dayLow : null,
    dayHigh: typeof q.dayHigh === 'number' ? q.dayHigh : null,
    volume: typeof q.volume === 'number' ? q.volume : null,
    source: `Financial Modeling Prep (${symbol})`,
    timestamp: q.timestamp ? new Date(q.timestamp * 1000).toISOString() : new Date().toISOString(),
    status: isWeekendClosed() ? 'closed' : 'delayed',
  };
}
