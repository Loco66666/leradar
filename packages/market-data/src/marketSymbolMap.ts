export type MarketKind = 'crypto' | 'forex' | 'metals' | 'indices' | 'macro';

export type MarketSymbol = {
  key: string;
  displayName: string;
  ticker: string;
  kind: MarketKind;
};

const SYMBOLS: Record<string, MarketSymbol> = {
  btc: { key: 'btc', displayName: 'Bitcoin', ticker: 'bitcoin', kind: 'crypto' },
  eth: { key: 'eth', displayName: 'Ethereum', ticker: 'ethereum', kind: 'crypto' },
  sol: { key: 'sol', displayName: 'Solana', ticker: 'solana', kind: 'crypto' },
  bnb: { key: 'bnb', displayName: 'BNB', ticker: 'binancecoin', kind: 'crypto' },
  xrp: { key: 'xrp', displayName: 'XRP', ticker: 'ripple', kind: 'crypto' },
  eurusd: { key: 'eurusd', displayName: 'EUR/USD', ticker: 'EUR/USD', kind: 'forex' },
  gbpusd: { key: 'gbpusd', displayName: 'GBP/USD', ticker: 'GBP/USD', kind: 'forex' },
  usdjpy: { key: 'usdjpy', displayName: 'USD/JPY', ticker: 'USD/JPY', kind: 'forex' },
  usdchf: { key: 'usdchf', displayName: 'USD/CHF', ticker: 'USD/CHF', kind: 'forex' },
  audusd: { key: 'audusd', displayName: 'AUD/USD', ticker: 'AUD/USD', kind: 'forex' },
  usdcad: { key: 'usdcad', displayName: 'USD/CAD', ticker: 'USD/CAD', kind: 'forex' },
  xau: { key: 'xau', displayName: 'Or (XAU)', ticker: 'XAU/USD', kind: 'metals' },
  xag: { key: 'xag', displayName: 'Argent (XAG)', ticker: 'XAG/USD', kind: 'metals' },
  ndx: { key: 'ndx', displayName: 'Nasdaq 100', ticker: 'NDX', kind: 'indices' },
  spx: { key: 'spx', displayName: 'S&P 500', ticker: 'SPX', kind: 'indices' },
  dj30: { key: 'dj30', displayName: 'Dow Jones', ticker: 'DJI', kind: 'indices' },
  dxy: { key: 'dxy', displayName: 'US Dollar Index (DXY)', ticker: 'DXY', kind: 'macro' },
  vix: { key: 'vix', displayName: 'Volatility Index (VIX)', ticker: 'VIX', kind: 'macro' },
};

const ALIASES: Record<string, string> = {
  bitcoin: 'btc', ethereum: 'eth', gold: 'xau', silver: 'xag', nasdaq: 'ndx', sp500: 'spx', dowjones: 'dj30',
};

export function resolveMarketSymbol(input: string): MarketSymbol | null {
  const key = input.trim().toLowerCase();
  const normalized = ALIASES[key] ?? key;
  return SYMBOLS[normalized] ?? null;
}
