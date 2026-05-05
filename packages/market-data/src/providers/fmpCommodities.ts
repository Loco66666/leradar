import { UnifiedMarketQuote } from './types.js';

type FmpCommodityQuote = {
  symbol?: string;
  name?: string;
  price?: number;
  changePercentage?: number;
  volume?: number;
  dayLow?: number;
  dayHigh?: number;
  previousClose?: number;
  timestamp?: number;
  exchange?: string;
};

function detectCommodityStatus(): 'delayed' | 'closed' {
  const day = new Date().getUTCDay();

  if (day === 0 || day === 6) return 'closed';

  return 'delayed';
}

export async function getFmpCommodityQuote(
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

  if (!response.ok) {
    throw new Error(`Donnée FMP commodities indisponible pour ${symbol}: HTTP ${response.status}`);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Réponse FMP commodities non JSON pour ${symbol}`);
  }

  if (!Array.isArray(payload) || !payload[0]) {
    throw new Error(`Donnée FMP commodities vide pour ${symbol}`);
  }

  const q = payload[0] as FmpCommodityQuote;

  if (typeof q.price !== 'number' || !Number.isFinite(q.price) || q.price <= 0) {
    throw new Error(`Prix FMP commodities invalide pour ${symbol}`);
  }

  return {
    asset,
    displayName: q.name ?? displayName,
    price: q.price,
    change24h: typeof q.changePercentage === 'number' ? q.changePercentage : null,
    dayLow: typeof q.dayLow === 'number' ? q.dayLow : null,
    dayHigh: typeof q.dayHigh === 'number' ? q.dayHigh : null,
    volume: typeof q.volume === 'number' ? q.volume : null,
    source: `Financial Modeling Prep Commodities (${symbol})`,
    timestamp: q.timestamp ? new Date(q.timestamp * 1000).toISOString() : new Date().toISOString(),
    status: detectCommodityStatus(),
  };
}
