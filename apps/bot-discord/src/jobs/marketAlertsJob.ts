import { Client, TextChannel } from 'discord.js';
import { prisma } from '@leradar/database';
import { getAssetPrice } from '@leradar/market-data';
import { getAlertAssets, type AssetRegistryItem } from '@leradar/market-data/assetRegistry';
import {
  analyzeMarketContext,
  type AssetMoveInput,
  type MarketContextInput,
  type MarketIntelligenceResult,
} from '@leradar/market-intelligence';
import { env } from '../config/env.js';
import { EMBED_COLORS, createWarningEmbed } from '../utils/embedFactory.js';
import { logger } from '../utils/logger.js';

const COOLDOWN_MINUTES = 60;
const lastAlertAt = new Map<string, number>();

type AlertRule = {
  thresholdPercent: number;
  strongPercent: number;
  criticalPercent: number;
};

type AlertCandidate = {
  asset: AssetMoveInput;
  rule: AlertRule;
  importance: {
    label: string;
    color: (typeof EMBED_COLORS)[keyof typeof EMBED_COLORS];
  };
};

function shouldSkipStatus(status: string): boolean {
  return status === 'closed' || status === 'unavailable';
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'historique insuffisant';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatPrice(asset: string, value: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: value > 100 ? 2 : 5,
  }).format(value);

  const key = asset.toLowerCase();

  if (key.includes('gold')) return `${formatted} $ / oz`;
  if (key.includes('eurusd')) return formatted;
  if (key.includes('vix')) return formatted;

  return `${formatted} $`;
}

function getRule(registryAsset?: AssetRegistryItem): AlertRule {
  if (registryAsset) {
    return {
      thresholdPercent: registryAsset.thresholds.alert,
      strongPercent: registryAsset.thresholds.strong,
      criticalPercent: registryAsset.thresholds.critical,
    };
  }

  return {
    thresholdPercent: env.ALERT_THRESHOLD_PERCENT,
    strongPercent: env.ALERT_THRESHOLD_PERCENT * 2,
    criticalPercent: env.ALERT_THRESHOLD_PERCENT * 4,
  };
}

function getImportance(change: number, rule: AlertRule): AlertCandidate['importance'] {
  const abs = Math.abs(change);

  if (abs >= rule.criticalPercent) {
    return { label: '🔴 Critique', color: EMBED_COLORS.error };
  }

  if (abs >= rule.strongPercent) {
    return { label: '🟠 Forte', color: EMBED_COLORS.warning };
  }

  if (abs >= rule.thresholdPercent) {
    return { label: '🟡 Modérée', color: EMBED_COLORS.warning };
  }

  return { label: '🟢 Faible', color: EMBED_COLORS.success };
}

function getAssetIcon(asset: string): string {
  const key = asset.toLowerCase();

  if (key.includes('btc')) return '₿';
  if (key.includes('eth')) return '♦️';
  if (key.includes('gold')) return '🥇';
  if (key.includes('eurusd')) return '💱';
  if (key.includes('nasdaq')) return '📊';
  if (key.includes('sp500')) return '🇺🇸';
  if (key.includes('vix')) return '⚠️';

  return '📡';
}

function getTitle(displayName: string, asset: string, change: number): string {
  const icon = getAssetIcon(asset);
  const abs = Math.abs(change);

  if (asset.toLowerCase().includes('vix')) {
    if (change > 0) return `${icon} VIX — volatilité en hausse`;
    return `${icon} VIX — détente de la volatilité`;
  }

  if (abs < 1) {
    return change > 0
      ? `${icon} ${displayName} — léger rebond court terme`
      : `${icon} ${displayName} — léger repli court terme`;
  }

  return change > 0
    ? `${icon} ${displayName} — mouvement haussier détecté`
    : `${icon} ${displayName} — pression baissière détectée`;
}

function getTrendLabel(change: number | null): string {
  if (change === null || !Number.isFinite(change)) return 'indisponible';
  if (change > 0.25) return 'haussière';
  if (change < -0.25) return 'baissière';
  return 'neutre';
}

function getRadarReading(
  displayName: string,
  asset: string,
  change: number,
  rule: AlertRule,
  intelligence?: MarketIntelligenceResult,
): string {
  const abs = Math.abs(change);
  const direction = change > 0 ? 'progresse' : 'recule';
  const key = asset.toLowerCase();

  if (key.includes('vix')) {
    if (change > 0) {
      return 'Le VIX monte, ce qui indique une hausse de la nervosité sur le marché. Le mouvement devient pertinent surtout s’il s’accompagne d’une baisse des indices.';
    }

    return 'Le VIX recule, ce qui indique une détente de la volatilité. Le contexte devient potentiellement plus calme si les indices restent stables ou progressent.';
  }

  if (key.includes('gold') && intelligence?.mood === 'risk-off' && change < 0) {
    return 'L’or recule malgré un contexte global plus défensif. Le mouvement reste modéré, mais il mérite surveillance si la pression continue.';
  }

  if (abs < rule.strongPercent) {
    return `${displayName} ${direction}, mais le mouvement reste mesuré. À ce stade, cela ressemble davantage à un mouvement court terme qu’à une rupture forte.`;
  }

  if (abs < rule.criticalPercent) {
    return `${displayName} ${direction} avec une intensité notable. Le mouvement mérite surveillance, surtout s’il se confirme sur les prochains relevés.`;
  }

  return `${displayName} ${direction} fortement. Le mouvement est inhabituel et peut traduire une phase de marché plus nerveuse.`;
}

function getWatchText(asset: string, change: number, rule: AlertRule): string {
  const direction = change > 0 ? 'hausse' : 'baisse';
  const nextLevel = rule.strongPercent;

  if (asset.toLowerCase().includes('vix')) {
    return 'À surveiller : confirmation si le VIX continue d’accélérer et si les indices US se dégradent en même temps.';
  }

  return `À surveiller : confirmation si la ${direction} se poursuit et dépasse environ ${nextLevel}% sur les prochains relevés.`;
}

function getMoodLabel(mood: MarketIntelligenceResult['mood']): string {
  switch (mood) {
    case 'risk-on':
      return '🟢 Risk-on';
    case 'risk-off':
      return '🔴 Risk-off';
    case 'mixed':
      return '🟡 Mitigé';
    case 'neutral':
    default:
      return '⚪ Neutre';
  }
}

function formatBulletList(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  return items.slice(0, 2).map((item) => `- ${item}`).join('\n');
}

function canSendAlert(asset: string): boolean {
  const now = Date.now();
  const last = lastAlertAt.get(asset) ?? 0;
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

  return now - last >= cooldownMs;
}

function markAlertSent(asset: string): void {
  lastAlertAt.set(asset, Date.now());
}

async function getSnapshotChange(asset: string, currentPrice: number, minutesAgo: number): Promise<number | null> {
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);

  const snapshot = await prisma.marketSnapshot.findFirst({
    where: {
      asset,
      createdAt: {
        lte: cutoff,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!snapshot || snapshot.price <= 0) return null;

  return ((currentPrice - snapshot.price) / snapshot.price) * 100;
}

function buildMarketContext(assets: AssetMoveInput[]): MarketContextInput {
  const context: MarketContextInput = {};

  for (const asset of assets) {
    const key = asset.asset.toLowerCase();

    if (key === 'btc') context.btc = asset;
    if (key === 'eth') context.eth = asset;
    if (key === 'gold') context.gold = asset;
    if (key === 'eurusd') context.eurusd = asset;
    if (key === 'nasdaq') context.nasdaq = asset;
    if (key === 'sp500') context.sp500 = asset;
    if (key === 'vix') context.vix = asset;
  }

  return context;
}

export async function runMarketAlertsJob(client: Client) {
  logger.info(
    {
      channelId: env.ALERT_CHANNEL_ID,
      globalThreshold: env.ALERT_THRESHOLD_PERCENT,
      cooldownMinutes: COOLDOWN_MINUTES,
    },
    '[ALERTS] Job alertes marché lancé',
  );

  if (!env.ALERT_CHANNEL_ID) {
    logger.error('[ALERTS] ALERT_CHANNEL_ID manquant');
    return;
  }

  const channel = await client.channels.fetch(env.ALERT_CHANNEL_ID).catch((error) => {
    logger.error({ error }, '[ALERTS] Impossible de récupérer le salon d’alertes');
    return null;
  });

  if (!channel || !(channel instanceof TextChannel)) {
    logger.error('[ALERTS] Salon introuvable ou non textuel');
    return;
  }

  const scannedAssets: AssetMoveInput[] = [];
  const alertCandidates: AlertCandidate[] = [];

  for (const registryAsset of getAlertAssets()) {
    const assetName = registryAsset.id;
    try {
      const asset = await getAssetPrice(assetName);

      if (!asset || asset.price === null || shouldSkipStatus(asset.status)) {
        logger.info(
          { assetName, status: asset?.status, price: asset?.price },
          '[ALERTS] Actif ignoré',
        );
        continue;
      }

      const last = await prisma.marketSnapshot.findFirst({
        where: { asset: asset.asset },
        orderBy: { createdAt: 'desc' },
      });

      await prisma.marketSnapshot.create({
        data: {
          asset: asset.asset,
          price: asset.price,
          source: asset.source,
        },
      });

      if (!last || last.price <= 0) {
        logger.info({ asset: asset.asset }, '[ALERTS] Premier snapshot créé');
        continue;
      }

      const changeShortTerm = ((asset.price - last.price) / last.price) * 100;
      const change1h = await getSnapshotChange(asset.asset, asset.price, 60);
      const change24h = await getSnapshotChange(asset.asset, asset.price, 24 * 60);

      const move: AssetMoveInput = {
        asset: asset.asset,
        displayName: asset.displayName,
        price: asset.price,
        changeShortTerm,
        change1h,
        change24h,
        source: asset.source,
      };

      scannedAssets.push(move);

      const rule = getRule(registryAsset);
      const importance = getImportance(changeShortTerm, rule);

      logger.info(
        {
          asset: asset.asset,
          price: asset.price,
          changeShortTerm,
          change1h,
          change24h,
          threshold: rule.thresholdPercent,
        },
        '[ALERTS] Variation calculée',
      );

      if (Math.abs(changeShortTerm) < rule.thresholdPercent) {
        logger.info(
          {
            asset: asset.asset,
            changeShortTerm,
            threshold: rule.thresholdPercent,
          },
          '[ALERTS] Variation sous le seuil actif',
        );
        continue;
      }

      if (!canSendAlert(asset.asset)) {
        logger.info({ asset: asset.asset }, '[ALERTS] Cooldown actif');
        continue;
      }

      alertCandidates.push({
        asset: move,
        rule,
        importance,
      });
    } catch (error) {
      const err = error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

      logger.error({ error: err, assetName }, '[ALERTS] Erreur job alertes marché');
    }
  }

  const intelligence = analyzeMarketContext(buildMarketContext(scannedAssets));

  logger.info(
    {
      mood: intelligence.mood,
      score: intelligence.score,
      signals: intelligence.signals,
    },
    '[ALERTS] Intelligence marché calculée',
  );

  for (const candidate of alertCandidates) {
    const { asset, rule, importance } = candidate;

    const trend1h = getTrendLabel(asset.change1h);
    const trend24h = getTrendLabel(asset.change24h);

    const embed = createWarningEmbed({
      title: getTitle(asset.displayName, asset.asset, asset.changeShortTerm),
      description: [
        '📊 **Mouvement**',
        `Prix : **${formatPrice(asset.asset, asset.price)}**`,
        `Variation court terme : **${formatPercent(asset.changeShortTerm)}**`,
        `Variation 1h : **${formatPercent(asset.change1h)}**`,
        `Variation 24h : **${formatPercent(asset.change24h)}**`,
        '',
        '🧭 **Lecture Radar**',
        getRadarReading(asset.displayName, asset.asset, asset.changeShortTerm, rule, intelligence),
        '',
        '🧠 **Intelligence marché**',
        `Contexte : **${getMoodLabel(intelligence.mood)}**`,
        `Score Radar : **${intelligence.score} / 5**`,
        '',
        '**Facteurs de soutien :**',
        formatBulletList(intelligence.factors, '- Aucun soutien clair détecté.'),
        '',
        '**Risques à surveiller :**',
        formatBulletList(intelligence.risks, '- Aucun risque dominant détecté.'),
        '',
        '🌍 **Tendances**',
        `Tendance 1h : **${trend1h}**`,
        `Tendance 24h : **${trend24h}**`,
        '',
        '⚠️ **Importance**',
        importance.label,
        '',
        '👀 **À surveiller**',
        getWatchText(asset.asset, asset.changeShortTerm, rule),
        '',
        `Source : **${asset.source}**`,
        'Information éducative uniquement. Aucun conseil financier.',
      ].join('\n'),
      color: importance.color,
    });

    await channel.send({ embeds: [embed] });
    markAlertSent(asset.asset);

    logger.warn(
      {
        asset: asset.asset,
        changeShortTerm: asset.changeShortTerm,
        change1h: asset.change1h,
        change24h: asset.change24h,
        mood: intelligence.mood,
        score: intelligence.score,
        source: asset.source,
      },
      '[ALERTS] Alerte premium intelligence envoyée',
    );
  }
}
