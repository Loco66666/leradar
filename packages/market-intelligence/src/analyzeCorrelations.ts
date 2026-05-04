import { CorrelationInsight, MarketContextInput } from './types.js';

function move(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return value;
}

function isUp(value: number | null, threshold: number): boolean {
  return value !== null && value >= threshold;
}

function isDown(value: number | null, threshold: number): boolean {
  return value !== null && value <= -threshold;
}

function avg(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));

  if (valid.length === 0) return null;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function addInsight(
  insights: CorrelationInsight[],
  insight: CorrelationInsight,
  condition: boolean,
): void {
  if (condition) insights.push(insight);
}

function severityRank(severity: CorrelationInsight['severity']): number {
  if (severity === 'strong') return 3;
  if (severity === 'watch') return 2;
  return 1;
}

export function analyzeCorrelations(input: MarketContextInput): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  const btc = move(input.btc?.changeShortTerm);
  const eth = move(input.eth?.changeShortTerm);
  const gold = move(input.gold?.changeShortTerm);
  const eurusd = move(input.eurusd?.changeShortTerm);
  const nasdaq = move(input.nasdaq?.changeShortTerm);
  const sp500 = move(input.sp500?.changeShortTerm);
  const stress = move(input.vix?.changeShortTerm);

  const crypto = avg([btc, eth]);
  const indices = avg([nasdaq, sp500]);

  const cryptoStrong = isUp(crypto, 0.5);
  const cryptoWeak = isDown(crypto, 0.5);

  const indicesStrong = isUp(indices, 0.35);
  const indicesWeak = isDown(indices, 0.35);

  const stressUp = isUp(stress, 2);
  const stressDown = isDown(stress, 2);

  const dollarFirm = isDown(eurusd, 0.15);
  const dollarSoft = isUp(eurusd, 0.15);

  const goldStrong = isUp(gold, 0.3);
  const goldWeak = isDown(gold, 0.3);

  addInsight(
    insights,
    {
      id: 'risk_off_confirmation',
      title: 'Climat défensif confirmé',
      summary: 'Les indices US reculent pendant que le stress marché augmente.',
      impact: 'Le marché montre une posture prudente : les actifs risqués sont sous pression.',
      severity: 'strong',
      confidence: 90,
      assets: ['nasdaq', 'sp500', 'vix'],
    },
    indicesWeak && stressUp,
  );

  addInsight(
    insights,
    {
      id: 'risk_on_alignment',
      title: 'Alignement constructif',
      summary: 'Les indices et les cryptos progressent pendant que le stress marché se détend.',
      impact: 'Le contexte devient plus favorable aux actifs risqués.',
      severity: 'strong',
      confidence: 88,
      assets: ['btc', 'eth', 'nasdaq', 'sp500', 'vix'],
    },
    indicesStrong && cryptoStrong && stressDown,
  );

  addInsight(
    insights,
    {
      id: 'crypto_resilience',
      title: 'Résistance crypto',
      summary: 'Les cryptos résistent alors que les indices US restent fragiles.',
      impact: 'Divergence constructive à surveiller : le marché crypto ne suit pas totalement la faiblesse des indices.',
      severity: 'watch',
      confidence: 76,
      assets: ['btc', 'eth', 'nasdaq', 'sp500'],
    },
    cryptoStrong && indicesWeak,
  );

  addInsight(
    insights,
    {
      id: 'broad_risk_pressure',
      title: 'Pression généralisée sur le risque',
      summary: 'Cryptos faibles, indices faibles et stress marché en hausse.',
      impact: 'Le signal défensif est plus large et ne concerne pas un seul actif isolé.',
      severity: 'strong',
      confidence: 92,
      assets: ['btc', 'eth', 'nasdaq', 'sp500', 'vix'],
    },
    cryptoWeak && indicesWeak && stressUp,
  );

  addInsight(
    insights,
    {
      id: 'dollar_pressure_gold',
      title: 'Pression dollar cohérente',
      summary: 'EUR/USD recule pendant que l’or baisse.',
      impact: 'Un dollar plus ferme peut peser sur l’or et renforcer la pression macro.',
      severity: 'watch',
      confidence: 80,
      assets: ['eurusd', 'gold'],
    },
    dollarFirm && goldWeak,
  );

  addInsight(
    insights,
    {
      id: 'gold_safe_haven',
      title: 'Recherche de protection',
      summary: 'L’or progresse alors que les indices sont fragiles ou que le stress marché augmente.',
      impact: 'Le marché peut chercher davantage de protection face à un contexte plus nerveux.',
      severity: 'watch',
      confidence: 82,
      assets: ['gold', 'nasdaq', 'sp500', 'vix'],
    },
    goldStrong && (indicesWeak || stressUp),
  );

  addInsight(
    insights,
    {
      id: 'gold_not_confirming_risk_off',
      title: 'Or non défensif',
      summary: 'L’or recule malgré un climat de marché plus prudent.',
      impact: 'Le signal refuge n’est pas confirmé par l’or, ce qui rend la lecture plus nuancée.',
      severity: 'info',
      confidence: 70,
      assets: ['gold', 'vix', 'nasdaq', 'sp500'],
    },
    goldWeak && (indicesWeak || stressUp),
  );

  addInsight(
    insights,
    {
      id: 'dollar_relief',
      title: 'Détente dollar',
      summary: 'EUR/USD progresse, ce qui suggère un dollar moins dominant.',
      impact: 'Cela peut alléger la pression sur certains actifs sensibles au dollar.',
      severity: 'info',
      confidence: 68,
      assets: ['eurusd'],
    },
    dollarSoft,
  );

  addInsight(
    insights,
    {
      id: 'stress_without_index_break',
      title: 'Stress en hausse sans rupture des indices',
      summary: 'Le stress marché augmente, mais les indices ne décrochent pas franchement.',
      impact: 'Le marché devient nerveux, mais la pression n’est pas encore pleinement confirmée par les indices.',
      severity: 'watch',
      confidence: 72,
      assets: ['vix', 'nasdaq', 'sp500'],
    },
    stressUp && !indicesWeak,
  );

  return insights
    .sort((a, b) => {
      const severityDiff = severityRank(b.severity) - severityRank(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    })
    .slice(0, 5);
}
