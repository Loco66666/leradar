import { UnifiedMarketQuote } from './types.js';

type TwelveDataQuote = {
  symbol?: string;
  datetime?: string;
  timestamp?: string | number;
  close?: string;
  high?: string;
  low?: string;
  volume?: string;
  previous_close?: string;
  status?: string;
  code?: number;
  message?: string;
};

const SYMBOL_CANDIDATES: Record<string, string[]> = {
  nasdaq: ['NDX', 'IXIC'],
  sp500: ['SPX', 'GSPC'],
  vix: ['VIX'],
  dxy: ['DXY'],

};

function toNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}



function detectMarketStatus(asset: string): 'live' | 'delayed' | 'closed' {
  const now = new Date();
  const day = now.getUTCDay();   // 0 dimanche, 6 samedi
  const hour = now.getUTCHours();

  if (asset in {'btc':1,'eth':1,'sol':1,'bnb':1,'xrp':1}) {
    return 'live';
  }

  if (['gold','silver','eurusd','gbpusd','usdjpy','usdchf','audusd','nzdusd','usdcad','eurgbp','eurjpy','gbpjpy','audjpy','cadjpy','chfjpy','eurchf','euraud','eurcad','gbpaud','gbpcad'].includes(asset)) {
    if (day === 6) return 'closed';
    if (day === 0 && hour < 22) return 'closed';
    if (day === 5 && hour >= 22) return 'closed';
    return 'delayed';
  }

  if (['nasdaq','sp500','vix','dxy'].includes(asset)) {
    if (day === 0 || day === 6) return 'closed';
    return 'delayed';
  }

  return 'delayed';
}

function normalizeProviderTimestamp(value?: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 1000000000) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const raw = value.trim();

    if (/^\d+$/.test(raw)) {
      const unix = Number(raw);
      if (Number.isFinite(unix) && unix > 1000000000) {
        return new Date(unix * 1000).toISOString();
      }
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
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

  const candidates = SYMBOL_CANDIDATES[asset] ?? [symbol];
  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      const data = await fetchTwelveData(candidate, apiKey);

      if (data.status === 'error' || data.code || data.message) {
        throw new Error(data.message ?? `Erreur Twelve Data (${data.code ?? 'inconnue'})`);
      }

      const price = toNumber(data.close);

      if (price === null || price <= 0) {
        throw new Error(`Prix invalide reçu depuis Twelve Data pour ${candidate}`);
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
        source: `Twelve Data (${candidate})`,
        timestamp: normalizeProviderTimestamp(data.datetime ?? data.timestamp),
        status: detectMarketStatus(asset),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Erreur inconnue Twelve Data';
      console.error('[Le Radar][Twelve Data]', {
        asset,
        symbol: candidate,
        provider: 'Twelve Data',
        error: lastError,
      });
    }
  }

  throw new Error(lastError ?? 'Erreur Twelve Data');
}
