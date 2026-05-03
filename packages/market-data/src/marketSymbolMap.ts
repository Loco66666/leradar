export type MarketKind = 'crypto' | 'yahoo';

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
  xau: { key: 'xau', displayName: 'Or (XAU)', ticker: 'GC=F', kind: 'yahoo' },
  xag: { key: 'xag', displayName: 'Argent (XAG)', ticker: 'SI=F', kind: 'yahoo' },
  ndx: { key: 'ndx', displayName: 'Nasdaq 100', ticker: '^NDX', kind: 'yahoo' },
  spx: { key: 'spx', displayName: 'S&P 500', ticker: '^GSPC', kind: 'yahoo' },
  dj30: { key: 'dj30', displayName: 'Dow Jones', ticker: '^DJI', kind: 'yahoo' },
  eurusd: { key: 'eurusd', displayName: 'EUR/USD', ticker: 'EURUSD=X', kind: 'yahoo' },
  gbpusd: { key: 'gbpusd', displayName: 'GBP/USD', ticker: 'GBPUSD=X', kind: 'yahoo' },
  usdjpy: { key: 'usdjpy', displayName: 'USD/JPY', ticker: 'USDJPY=X', kind: 'yahoo' },
  usdchf: { key: 'usdchf', displayName: 'USD/CHF', ticker: 'USDCHF=X', kind: 'yahoo' },
  audusd: { key: 'audusd', displayName: 'AUD/USD', ticker: 'AUDUSD=X', kind: 'yahoo' },
  usdcad: { key: 'usdcad', displayName: 'USD/CAD', ticker: 'USDCAD=X', kind: 'yahoo' },
  dxy: { key: 'dxy', displayName: 'US Dollar Index (DXY)', ticker: 'DX-Y.NYB', kind: 'yahoo' },
  vix: { key: 'vix', displayName: 'Volatility Index (VIX)', ticker: '^VIX', kind: 'yahoo' },
};

const ALIASES: Record<string, string> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  gold: 'xau',
  silver: 'xag',
  nasdaq: 'ndx',
  sp500: 'spx',
  dowjones: 'dj30',
  xau: 'xau',
  xag: 'xag',
};

export function resolveMarketSymbol(input: string): MarketSymbol | null {
  const key = input.trim().toLowerCase();
  const normalized = ALIASES[key] ?? key;
  return SYMBOLS[normalized] ?? null;
}
