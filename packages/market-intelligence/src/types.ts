export type MarketMood = 'risk-on' | 'risk-off' | 'neutral' | 'mixed';

export type IntelligenceSignal =
  | 'strong_up'
  | 'strong_down'
  | 'volatility_rising'
  | 'volatility_falling'
  | 'dollar_strength'
  | 'dollar_weakness'
  | 'indices_strength'
  | 'indices_weakness'
  | 'gold_strength'
  | 'gold_weakness'
  | 'crypto_strength'
  | 'crypto_weakness';

export type CorrelationSeverity = 'info' | 'watch' | 'strong';

export type CorrelationInsight = {
  id: string;
  title: string;
  summary: string;
  impact: string;
  severity: CorrelationSeverity;
  confidence: number;
  assets: string[];
};

export type AssetMoveInput = {
  asset: string;
  displayName: string;
  price: number;
  changeShortTerm: number;
  change1h: number | null;
  change24h: number | null;
  source: string;
};

export type MarketContextInput = {
  btc?: AssetMoveInput;
  eth?: AssetMoveInput;
  gold?: AssetMoveInput;
  eurusd?: AssetMoveInput;
  nasdaq?: AssetMoveInput;
  sp500?: AssetMoveInput;
  vix?: AssetMoveInput;
};

export type MarketIntelligenceResult = {
  mood: MarketMood;
  score: number;
  signals: IntelligenceSignal[];
  summary: string;
  factors: string[];
  risks: string[];
  correlations: CorrelationInsight[];
};
