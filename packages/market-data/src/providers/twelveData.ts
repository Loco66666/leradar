import { UnifiedMarketQuote } from './types.js';

type TwelveDataQuote = {
  symbol?: string;
  timestamp?: string;
  close?: string;
  high?: string;
  low?: string;
  volume?: string;
  previous_close?: string;
  status?: string;
  code?: number;
  message?: string;
};

const NASDAQ_CANDIDATES = ['NDX', 'NASDAQ'];

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function fetchTwelveData(symbol: string, apiKey: string): Promise<TwelveDataQuote> {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  const payload = (await response.json()) as TwelveDataQuote;
  if (!response.ok) {
    throw new Error(payload.message ?? `Erreur Twelve Data (${response.status})`);
  }
  return payload;
}

export async function getTwelveDataQuote(
  asset: string,
  displayName: string,
  symbol: string,
): Promise<UnifiedMarketQuote> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('TWELVE_DATA_API_KEY est manquant');
  }

  const candidates = asset === 'nasdaq' ? NASDAQ_CANDIDATES : [symbol];
  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      const data = await fetchTwelveData(candidate, apiKey);
      if (data.status === 'error' || data.code || data.message) {
        throw new Error(data.message ?? `Erreur Twelve Data (${data.code ?? 'inconnue'})`);
      }

      const price = toNumber(data.close);
      if (price === null) {
        throw new Error('Prix invalide reçu depuis Twelve Data');
      }

      const prevClose = toNumber(data.previous_close);
      const change24h = prevClose && prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : null;

      return {
        asset,
        displayName,
        price,
        change24h,
        dayLow: toNumber(data.low),
        dayHigh: toNumber(data.high),
        volume: toNumber(data.volume),
        source: 'Twelve Data',
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        status: 'live',
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Erreur inconnue Twelve Data';
    }
  }

  throw new Error(lastError ?? 'Erreur Twelve Data');
}
