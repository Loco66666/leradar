export type AssetCategory =
  | 'crypto'
  | 'forex'
  | 'metals'
  | 'indices'
  | 'stocks'
  | 'etf'
  | 'commodities';

export type MarketDataProvider =
  | 'coingecko'
  | 'coinbase'
  | 'twelveData'
  | 'fmp';

export type AssetRegistryItem = {
  id: string;
  displayName: string;
  category: AssetCategory;
  aliases: string[];

  provider: MarketDataProvider;
  providerSymbol: string;

  fallbackProvider?: MarketDataProvider;
  fallbackSymbol?: string;

  alertEnabled: boolean;
  marketPulseEnabled: boolean;

  thresholds: {
    alert: number;
    strong: number;
    critical: number;
  };
};

export const ASSET_REGISTRY: AssetRegistryItem[] = [
  // =========================
  // Crypto majeures
  // =========================
  {
    id: 'btc',
    displayName: 'Bitcoin',
    category: 'crypto',
    aliases: ['btc', 'bitcoin', '₿'],
    provider: 'coingecko',
    providerSymbol: 'bitcoin',
    fallbackProvider: 'coinbase',
    fallbackSymbol: 'BTC-USD',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 1, strong: 2.5, critical: 5 },
  },
  {
    id: 'eth',
    displayName: 'Ethereum',
    category: 'crypto',
    aliases: ['eth', 'ethereum', 'ether'],
    provider: 'coingecko',
    providerSymbol: 'ethereum',
    fallbackProvider: 'coinbase',
    fallbackSymbol: 'ETH-USD',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 1, strong: 3, critical: 6 },
  },
  {
    id: 'sol',
    displayName: 'Solana',
    category: 'crypto',
    aliases: ['sol', 'solana'],
    provider: 'coingecko',
    providerSymbol: 'solana',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 5, critical: 9 },
  },
  {
    id: 'bnb',
    displayName: 'BNB',
    category: 'crypto',
    aliases: ['bnb', 'binance coin', 'binancecoin'],
    provider: 'coingecko',
    providerSymbol: 'binancecoin',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 5, critical: 9 },
  },
  {
    id: 'xrp',
    displayName: 'XRP',
    category: 'crypto',
    aliases: ['xrp', 'ripple'],
    provider: 'coingecko',
    providerSymbol: 'ripple',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 5, critical: 9 },
  },
  {
    id: 'ada',
    displayName: 'Cardano',
    category: 'crypto',
    aliases: ['ada', 'cardano'],
    provider: 'coingecko',
    providerSymbol: 'cardano',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 5, critical: 9 },
  },
  {
    id: 'doge',
    displayName: 'Dogecoin',
    category: 'crypto',
    aliases: ['doge', 'dogecoin'],
    provider: 'coingecko',
    providerSymbol: 'dogecoin',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 3, strong: 7, critical: 12 },
  },
  {
    id: 'link',
    displayName: 'Chainlink',
    category: 'crypto',
    aliases: ['link', 'chainlink'],
    provider: 'coingecko',
    providerSymbol: 'chainlink',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 6, critical: 10 },
  },
  {
    id: 'avax',
    displayName: 'Avalanche',
    category: 'crypto',
    aliases: ['avax', 'avalanche'],
    provider: 'coingecko',
    providerSymbol: 'avalanche-2',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 6, critical: 10 },
  },
  {
    id: 'dot',
    displayName: 'Polkadot',
    category: 'crypto',
    aliases: ['dot', 'polkadot'],
    provider: 'coingecko',
    providerSymbol: 'polkadot',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 6, critical: 10 },
  },

  // =========================
  // Forex majeures
  // =========================
  {
    id: 'eurusd',
    displayName: 'EUR/USD',
    category: 'forex',
    aliases: ['eurusd', 'eur/usd', 'euro dollar'],
    provider: 'twelveData',
    providerSymbol: 'EUR/USD',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 0.25, strong: 0.6, critical: 1.2 },
  },
  {
    id: 'gbpusd',
    displayName: 'GBP/USD',
    category: 'forex',
    aliases: ['gbpusd', 'gbp/usd', 'pound dollar'],
    provider: 'twelveData',
    providerSymbol: 'GBP/USD',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 0.3, strong: 0.7, critical: 1.3 },
  },
  {
    id: 'usdjpy',
    displayName: 'USD/JPY',
    category: 'forex',
    aliases: ['usdjpy', 'usd/jpy', 'dollar yen'],
    provider: 'twelveData',
    providerSymbol: 'USD/JPY',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 0.35, strong: 0.8, critical: 1.5 },
  },

  // =========================
  // Métaux
  // =========================
  {
    id: 'gold',
    displayName: 'Or (Gold)',
    category: 'metals',
    aliases: ['gold', 'or', 'xau', 'xauusd', 'xau/usd'],
    provider: 'twelveData',
    providerSymbol: 'XAU/USD',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 0.5, strong: 1.2, critical: 2.5 },
  },
  {
    id: 'silver',
    displayName: 'Argent (Silver)',
    category: 'metals',
    aliases: ['silver', 'argent', 'xag', 'xagusd', 'xag/usd'],
    provider: 'twelveData',
    providerSymbol: 'XAG/USD',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 0.8, strong: 1.8, critical: 3.5 },
  },

  // =========================
  // Indices
  // =========================
  {
    id: 'nasdaq',
    displayName: 'NASDAQ Composite',
    category: 'indices',
    aliases: ['nasdaq', 'ixic', 'ndx'],
    provider: 'fmp',
    providerSymbol: '^IXIC',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 0.7, strong: 1.5, critical: 3 },
  },
  {
    id: 'sp500',
    displayName: 'S&P 500',
    category: 'indices',
    aliases: ['sp500', 's&p500', 's&p 500', 'spx', 'gspc'],
    provider: 'fmp',
    providerSymbol: '^GSPC',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 0.7, strong: 1.4, critical: 2.8 },
  },
  {
    id: 'dowjones',
    displayName: 'Dow Jones Industrial Average',
    category: 'indices',
    aliases: ['dowjones', 'dow', 'dji', 'dj30'],
    provider: 'fmp',
    providerSymbol: '^DJI',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 0.7, strong: 1.4, critical: 2.8 },
  },
  {
    id: 'vix',
    displayName: 'Stress marché',
    category: 'indices',
    aliases: ['vix', 'volatilité', 'stress marché'],
    provider: 'fmp',
    providerSymbol: '^VIX',
    alertEnabled: true,
    marketPulseEnabled: true,
    thresholds: { alert: 5, strong: 10, critical: 20 },
  },

  // =========================
  // Actions US majeures
  // =========================
  {
    id: 'aapl',
    displayName: 'Apple',
    category: 'stocks',
    aliases: ['aapl', 'apple'],
    provider: 'fmp',
    providerSymbol: 'AAPL',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 4, critical: 7 },
  },
  {
    id: 'msft',
    displayName: 'Microsoft',
    category: 'stocks',
    aliases: ['msft', 'microsoft'],
    provider: 'fmp',
    providerSymbol: 'MSFT',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2, strong: 4, critical: 7 },
  },
  {
    id: 'nvda',
    displayName: 'NVIDIA',
    category: 'stocks',
    aliases: ['nvda', 'nvidia'],
    provider: 'fmp',
    providerSymbol: 'NVDA',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 3, strong: 6, critical: 10 },
  },
  {
    id: 'tsla',
    displayName: 'Tesla',
    category: 'stocks',
    aliases: ['tsla', 'tesla'],
    provider: 'fmp',
    providerSymbol: 'TSLA',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 3, strong: 6, critical: 10 },
  },
  {
    id: 'amzn',
    displayName: 'Amazon',
    category: 'stocks',
    aliases: ['amzn', 'amazon'],
    provider: 'fmp',
    providerSymbol: 'AMZN',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 5, critical: 8 },
  },
  {
    id: 'meta',
    displayName: 'Meta Platforms',
    category: 'stocks',
    aliases: ['meta', 'facebook'],
    provider: 'fmp',
    providerSymbol: 'META',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 5, critical: 8 },
  },
  {
    id: 'googl',
    displayName: 'Alphabet',
    category: 'stocks',
    aliases: ['googl', 'google', 'alphabet'],
    provider: 'fmp',
    providerSymbol: 'GOOGL',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 2.5, strong: 5, critical: 8 },
  },

  // =========================
  // ETF majeurs
  // =========================
  {
    id: 'spy',
    displayName: 'SPDR S&P 500 ETF',
    category: 'etf',
    aliases: ['spy'],
    provider: 'fmp',
    providerSymbol: 'SPY',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 1, strong: 2, critical: 4 },
  },
  {
    id: 'qqq',
    displayName: 'Invesco QQQ ETF',
    category: 'etf',
    aliases: ['qqq'],
    provider: 'fmp',
    providerSymbol: 'QQQ',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 1.2, strong: 2.5, critical: 5 },
  },
  {
    id: 'gld',
    displayName: 'SPDR Gold Shares',
    category: 'etf',
    aliases: ['gld'],
    provider: 'fmp',
    providerSymbol: 'GLD',
    alertEnabled: false,
    marketPulseEnabled: false,
    thresholds: { alert: 1, strong: 2, critical: 4 },
  },
];

const ASSET_BY_ID = new Map(ASSET_REGISTRY.map((asset) => [asset.id, asset]));

const ALIAS_TO_ID = new Map<string, string>();

for (const asset of ASSET_REGISTRY) {
  ALIAS_TO_ID.set(asset.id.toLowerCase(), asset.id);

  for (const alias of asset.aliases) {
    ALIAS_TO_ID.set(alias.toLowerCase(), asset.id);
  }
}

export function resolveAsset(input: string): AssetRegistryItem | null {
  const key = input.trim().toLowerCase();
  const id = ALIAS_TO_ID.get(key);

  if (!id) return null;

  return ASSET_BY_ID.get(id) ?? null;
}

export function getMarketPulseAssets(): AssetRegistryItem[] {
  return ASSET_REGISTRY.filter((asset) => asset.marketPulseEnabled);
}

export function getAlertAssets(): AssetRegistryItem[] {
  return ASSET_REGISTRY.filter((asset) => asset.alertEnabled);
}

export function getAssetsByCategory(category: AssetCategory): AssetRegistryItem[] {
  return ASSET_REGISTRY.filter((asset) => asset.category === category);
}
