export type UnifiedMarketQuote = {
  asset: string;
  displayName: string;
  price: number | null;
  change24h: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  volume: number | null;
  source: string;
  timestamp: string;
};

export async function getYahooQuote(symbol: string, displayName: string): Promise<UnifiedMarketQuote> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erreur Yahoo Finance');

  const payload = (await response.json()) as {
    quoteResponse?: { result?: Array<Record<string, number | string>> };
  };

  const quote = payload.quoteResponse?.result?.[0];
  if (!quote) throw new Error('Actif introuvable sur Yahoo Finance');

  return {
    asset: symbol,
    displayName,
    price: Number(quote.regularMarketPrice ?? NaN),
    change24h: Number(quote.regularMarketChangePercent ?? NaN),
    dayLow: Number(quote.regularMarketDayLow ?? NaN),
    dayHigh: Number(quote.regularMarketDayHigh ?? NaN),
    volume: Number(quote.regularMarketVolume ?? NaN),
    source: 'Yahoo Finance',
    timestamp: new Date().toISOString(),
  };
}
