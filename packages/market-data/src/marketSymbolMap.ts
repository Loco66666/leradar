export type MarketKind = 'crypto' | 'metals' | 'forex' | 'indices';

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

  gold: { key: 'gold', displayName: 'Or (Gold)', ticker: 'XAU/USD', kind: 'metals' },
  silver: { key: 'silver', displayName: 'Argent (Silver)', ticker: 'XAG/USD', kind: 'metals' },

  eurusd: { key: 'eurusd', displayName: 'EUR/USD', ticker: 'EUR/USD', kind: 'forex' },
  gbpusd: { key: 'gbpusd', displayName: 'GBP/USD', ticker: 'GBP/USD', kind: 'forex' },
  usdjpy: { key: 'usdjpy', displayName: 'USD/JPY', ticker: 'USD/JPY', kind: 'forex' },

  nasdaq: { key: 'nasdaq', displayName: 'NASDAQ Composite', ticker: '^IXIC', kind: 'indices' },
  sp500: { key: 'sp500', displayName: 'S&P 500', ticker: '^GSPC', kind: 'indices' },
  dowjones: { key: 'dowjones', displayName: 'Dow Jones Industrial Average', ticker: '^DJI', kind: 'indices' },
  vix: { key: 'vix', displayName: 'CBOE Volatility Index (VIX)', ticker: '^VIX', kind: 'indices' },
  dxy: { key: 'dxy', displayName: 'US Dollar Index (DXY)', ticker: 'DXY', kind: 'indices' },
};

const ALIASES: Record<string, string> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  xau: 'gold',
  xag: 'silver',
  ndx: 'nasdaq',
  ixic: 'nasdaq',
  spx: 'sp500',
  gspc: 'sp500',
  dji: 'dowjones',
  dow: 'dowjones',
  dj30: 'dowjones',
};

export function resolveMarketSymbol(input: string): MarketSymbol | null {
  const key = input.trim().toLowerCase();
  const normalized = ALIASES[key] ?? key;
  return SYMBOLS[normalized] ?? null;
}
