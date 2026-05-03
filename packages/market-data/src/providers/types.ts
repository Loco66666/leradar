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
  status: 'live' | 'delayed' | 'unavailable';
  note?: string;
};
