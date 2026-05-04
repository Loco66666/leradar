import {
  AssetMoveInput,
  IntelligenceSignal,
  MarketContextInput,
  MarketIntelligenceResult,
  MarketMood,
} from './types.js';

function isUp(asset: AssetMoveInput | undefined, threshold = 0.25): boolean {
  return Boolean(asset && asset.changeShortTerm >= threshold);
}

function isDown(asset: AssetMoveInput | undefined, threshold = 0.25): boolean {
  return Boolean(asset && asset.changeShortTerm <= -threshold);
}

function addSignal(
  signals: IntelligenceSignal[],
  signal: IntelligenceSignal,
  condition: boolean,
): void {
  if (condition) signals.push(signal);
}

function getMoodFromScore(score: number): MarketMood {
  if (score >= 2) return 'risk-on';
  if (score <= -2) return 'risk-off';
  if (score === 0) return 'neutral';
  return 'mixed';
}

function buildSummary(mood: MarketMood, factors: string[], risks: string[]): string {
  if (mood === 'risk-off') {
    const mainRisks = risks.slice(0, 2).join(' ');
    const nuance = factors.length > 0
      ? ` Certains éléments restent constructifs, mais ils ne suffisent pas à inverser le biais global.`
      : '';

    return `Le marché penche défensif. ${mainRisks || 'La pression globale reste supérieure aux facteurs de soutien.'}${nuance}`;
  }

  if (mood === 'risk-on') {
    const mainFactors = factors.slice(0, 2).join(' ');
    const nuance = risks.length > 0
      ? ` Quelques risques restent présents, mais le biais global reste favorable au risque.`
      : '';

    return `Le marché montre un biais favorable au risque. ${mainFactors || 'Les actifs risqués restent globalement soutenus.'}${nuance}`;
  }

  if (mood === 'mixed') {
    return `Le marché envoie des signaux contradictoires. Certains actifs restent soutenus, mais des risques persistent en parallèle.`;
  }

  return `Le marché ne montre pas encore de déséquilibre clair. Le contexte reste neutre à ce stade.`;
}

export function analyzeMarketContext(input: MarketContextInput): MarketIntelligenceResult {
  const signals: IntelligenceSignal[] = [];
  const factors: string[] = [];
  const risks: string[] = [];

  let score = 0;

  const btcUp = isUp(input.btc, 0.5);
  const btcDown = isDown(input.btc, 0.5);
  const ethUp = isUp(input.eth, 0.5);
  const ethDown = isDown(input.eth, 0.5);

  const nasdaqUp = isUp(input.nasdaq, 0.4);
  const nasdaqDown = isDown(input.nasdaq, 0.4);
  const sp500Up = isUp(input.sp500, 0.35);
  const sp500Down = isDown(input.sp500, 0.35);

  const vixUp = isUp(input.vix, 2);
  const vixDown = isDown(input.vix, 2);

  const goldUp = isUp(input.gold, 0.3);
  const goldDown = isDown(input.gold, 0.3);

  const eurusdUp = isUp(input.eurusd, 0.15);
  const eurusdDown = isDown(input.eurusd, 0.15);

  addSignal(signals, 'crypto_strength', btcUp || ethUp);
  addSignal(signals, 'crypto_weakness', btcDown || ethDown);
  addSignal(signals, 'indices_strength', nasdaqUp || sp500Up);
  addSignal(signals, 'indices_weakness', nasdaqDown || sp500Down);
  addSignal(signals, 'volatility_rising', vixUp);
  addSignal(signals, 'volatility_falling', vixDown);
  addSignal(signals, 'gold_strength', goldUp);
  addSignal(signals, 'gold_weakness', goldDown);
  addSignal(signals, 'dollar_weakness', eurusdUp);
  addSignal(signals, 'dollar_strength', eurusdDown);

  if (btcUp || ethUp) {
    score += 1;
    factors.push('Les crypto-actifs résistent mieux que le reste du marché.');
  }

  if (btcDown || ethDown) {
    score -= 1;
    risks.push('Les crypto-actifs montrent une pression baissière.');
  }

  if (nasdaqUp || sp500Up) {
    score += 1;
    factors.push('Les indices US soutiennent un contexte plus favorable au risque.');
  }

  if (nasdaqDown || sp500Down) {
    score -= 1;
    risks.push('Les indices US montrent une faiblesse court terme.');
  }

  if (vixUp) {
    score -= 2;
    risks.push('Le VIX progresse, signe d’une nervosité plus élevée sur le marché.');
  }

  if (vixDown) {
    score += 1;
    factors.push('Le VIX se détend, ce qui réduit la pression liée à la volatilité.');
  }

  if (eurusdUp) {
    score += 1;
    factors.push('EUR/USD progresse, ce qui peut traduire un dollar moins dominant.');
  }

  if (eurusdDown) {
    score -= 1;
    risks.push('EUR/USD recule, ce qui peut traduire un dollar plus ferme.');
  }

  if (goldUp && (nasdaqDown || sp500Down || vixUp)) {
    risks.push('L’or progresse dans un contexte défensif, ce qui peut signaler une recherche de protection.');
  }

  if (goldDown && (nasdaqUp || sp500Up)) {
    factors.push('L’or recule pendant que les indices tiennent, ce qui reste cohérent avec un contexte plus offensif.');
  }

  const mood = getMoodFromScore(score);

  return {
    mood,
    score,
    signals,
    summary: buildSummary(mood, factors, risks),
    factors,
    risks,
  };
}
