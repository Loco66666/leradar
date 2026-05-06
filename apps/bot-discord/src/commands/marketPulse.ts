import { APIEmbedField, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  analyzeMarketContext,
  type AssetMoveInput,
  type MarketContextInput,
  type MarketIntelligenceResult,
} from '@leradar/market-intelligence';
import { getAssetPrice } from '@leradar/market-data';
import { getMarketPulseAssets } from '@leradar/market-data/assetRegistry';
import { createErrorEmbed, createMarketEmbed, formatUsd } from '../utils/embedFactory.js';
import {
  formatMarketPulseProxyPrice,
  getMarketPulseDetailLabel,
  getMarketPulseShortLabel,
  protectMarketPulsePriceKeysValue,
  protectMarketPulseQuickViewValue,
  type MarketPulseUsProxyAsset,
} from './marketPulsePresentation.js';
import { logger } from '../utils/logger.js';

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatPrice(asset: string, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';

  const key = asset.toLowerCase();

  if (key === 'btc' || key === 'eth') return formatUsd(value);

  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: value > 100 ? 2 : 5,
  }).format(value);

  const proxyPrice = formatMarketPulseProxyPrice(key, value);

  if (proxyPrice) return proxyPrice;

  if (key === 'gold') return `${formatted} $/oz`;
  if (key === 'eurusd') return formatted;
  if (key === 'vix') return formatted;

  return `${formatted} pts`;
}

function getMoodTitle(mood: MarketIntelligenceResult['mood']): string {
  switch (mood) {
    case 'risk-on':
      return '🟢 Climat marché : constructif';
    case 'risk-off':
      return '🔴 Climat marché : défensif';
    case 'mixed':
      return '🟡 Climat marché : mitigé';
    case 'neutral':
    default:
      return '⚪ Climat marché : neutre';
  }
}

function getBiasLabel(mood: MarketIntelligenceResult['mood']): string {
  switch (mood) {
    case 'risk-on':
      return 'Les acheteurs gardent l’avantage à court terme.';
    case 'risk-off':
      return 'Le marché montre une posture prudente à court terme.';
    case 'mixed':
      return 'Les signaux sont partagés : le marché manque de direction claire.';
    case 'neutral':
    default:
      return 'Aucun biais fort ne domine pour le moment.';
  }
}

function normalizeSource(source: string): string {
  if (source.includes('CoinGecko')) return 'CoinGecko';
  if (source.includes('Coinbase')) return 'Coinbase';
  if (source.includes('Twelve Data')) return 'Twelve Data';
  if (source.includes('Financial Modeling Prep')) return 'FMP';
  return source;
}

function formatSources(assets: AssetMoveInput[]): string {
  const sources = [...new Set(assets.map((asset) => normalizeSource(asset.source)))];
  return sources.length > 0 ? sources.join(' • ') : 'Sources indisponibles';
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

function getAsset(assets: AssetMoveInput[], assetName: string): AssetMoveInput | undefined {
  return assets.find((asset) => asset.asset.toLowerCase() === assetName);
}

function moveText(asset: AssetMoveInput | undefined): string {
  if (!asset) return 'N/A';
  return formatPercent(asset.change24h);
}

function priceAndMove(asset: AssetMoveInput | undefined, displayAsset = asset?.asset): string {
  if (!asset || !displayAsset) return 'N/A';
  return `${formatPrice(displayAsset, asset.price)} · ${formatPercent(asset.change24h)}`;
}

function proxyMoveText(assetName: MarketPulseUsProxyAsset, asset: AssetMoveInput | undefined): string {
  return `${getMarketPulseShortLabel(assetName)} ${moveText(asset)}`;
}

function proxyPriceLine(icon: string, assetName: MarketPulseUsProxyAsset, asset: AssetMoveInput | undefined): string {
  return `${icon} ${getMarketPulseDetailLabel(assetName)} : ${priceAndMove(asset, assetName)}`;
}

function normalizeMarketPulseWording(text: string): string {
  return text
    .replace(/indices US/g, 'proxies US')
    .replace(/Indices US/g, 'Proxies US')
    .replace(/les indices/g, 'les proxies US')
    .replace(/Les indices/g, 'Les proxies US')
    .replace(/des indices/g, 'des proxies US')
    .replace(/Des indices/g, 'Des proxies US')
    .replace(/aux indices/g, 'aux proxies US')
    .replace(/indices faibles/g, 'proxies US faibles')
    .replace(/indices tiennent/g, 'proxies US tiennent')
    .replace(/indices ne décrochent/g, 'proxies US ne décrochent');
}

function getMarketStress(assets: AssetMoveInput[]): string {
  const vix = getAsset(assets, 'vix');
  const change = vix?.change24h;

  if (change === null || change === undefined || !Number.isFinite(change)) return 'indisponible';
  if (change >= 5) return 'élevé';
  if (change >= 2) return 'en hausse';
  if (change <= -5) return 'en détente';
  return 'normal';
}

function buildExecutiveSummary(assets: AssetMoveInput[], intelligence: MarketIntelligenceResult): string {
  const btc = getAsset(assets, 'btc');
  const eth = getAsset(assets, 'eth');
  const eurusd = getAsset(assets, 'eurusd');
  const nasdaq = getAsset(assets, 'nasdaq');
  const sp500 = getAsset(assets, 'sp500');
  const stress = getMarketStress(assets);

  const cryptoPositive = Boolean((btc?.change24h ?? 0) > 0 || (eth?.change24h ?? 0) > 0);
  const proxiesWeak = Boolean((nasdaq?.change24h ?? 0) < 0 || (sp500?.change24h ?? 0) < 0);
  const dollarFirm = Boolean((eurusd?.change24h ?? 0) < -0.15);

  if (intelligence.mood === 'risk-off') {
    return [
      `Le marché montre une attitude prudente : ${proxiesWeak ? 'les proxies US reculent' : 'les proxies US manquent de force'}, ${dollarFirm ? 'le dollar semble plus ferme' : 'le dollar ne donne pas encore de signal clair'}, et le stress marché est ${stress}.`,
      cryptoPositive
        ? 'Les cryptos résistent encore, mais le contexte global reste fragile.'
        : 'Les cryptos ne compensent pas la pression observée sur le reste du marché.',
    ].join(' ');
  }

  if (intelligence.mood === 'risk-on') {
    return [
      'Le marché montre un climat plus constructif : les actifs risqués sont mieux orientés et la pression globale reste contenue.',
      'Le contexte reste favorable tant que les proxies US tiennent et que le stress marché ne réaccélère pas.',
    ].join(' ');
  }

  if (intelligence.mood === 'mixed') {
    return [
      'Le marché envoie des signaux contradictoires.',
      'Certains actifs résistent, mais le contexte global manque encore d’alignement.',
    ].join(' ');
  }

  return 'Le marché reste équilibré pour le moment. Aucun signal dominant ne ressort clairement.';
}

function buildKeyTakeaways(assets: AssetMoveInput[]): string {
  const btc = getAsset(assets, 'btc');
  const eth = getAsset(assets, 'eth');
  const gold = getAsset(assets, 'gold');
  const eurusd = getAsset(assets, 'eurusd');
  const nasdaq = getAsset(assets, 'nasdaq');
  const sp500 = getAsset(assets, 'sp500');
  const dowjones = getAsset(assets, 'dowjones');

  const points: string[] = [];

  if ((nasdaq?.change24h ?? 0) < 0 || (sp500?.change24h ?? 0) < 0 || (dowjones?.change24h ?? 0) < 0) {
    const proxyMoves = [
      proxyMoveText('nasdaq', nasdaq),
      proxyMoveText('sp500', sp500),
      ...(dowjones ? [proxyMoveText('dowjones', dowjones)] : []),
    ].join(', ');

    points.push(`• Les proxies US sont sous pression : ${proxyMoves}.`);
  }

  if ((eurusd?.change24h ?? 0) < -0.15) {
    points.push(`• Le dollar semble plus ferme : EUR/USD ${moveText(eurusd)}.`);
  }

  if ((btc?.change24h ?? 0) > 0 || (eth?.change24h ?? 0) > 0) {
    points.push(`• Les cryptos résistent mieux : BTC ${moveText(btc)}, ETH ${moveText(eth)}.`);
  }

  if (gold && Math.abs(gold.change24h ?? 0) >= 0.5) {
    points.push(`• L’or bouge fortement : Gold ${moveText(gold)}.`);
  }

  if (points.length === 0) {
    return '• Aucun signal fort ne ressort clairement pour le moment.';
  }

  return points.slice(0, 4).join('\n');
}

function buildQuickView(assets: AssetMoveInput[]): string {
  const btc = getAsset(assets, 'btc');
  const eth = getAsset(assets, 'eth');
  const gold = getAsset(assets, 'gold');
  const eurusd = getAsset(assets, 'eurusd');
  const nasdaq = getAsset(assets, 'nasdaq');
  const sp500 = getAsset(assets, 'sp500');
  const dowjones = getAsset(assets, 'dowjones');
  const proxyMoves = [
    proxyMoveText('nasdaq', nasdaq),
    proxyMoveText('sp500', sp500),
    ...(dowjones ? [proxyMoveText('dowjones', dowjones)] : []),
  ].join(' · ');

  return [
    `**Crypto** : BTC ${moveText(btc)} · ETH ${moveText(eth)}`,
    `**Proxies US** : ${proxyMoves}`,
    `**Dollar** : EUR/USD ${moveText(eurusd)}`,
    `**Or** : Gold ${moveText(gold)}`,
    `**Stress marché** : ${getMarketStress(assets)}`,
  ].join('\n');
}

function buildPrices(assets: AssetMoveInput[]): string {
  const btc = getAsset(assets, 'btc');
  const eth = getAsset(assets, 'eth');
  const gold = getAsset(assets, 'gold');
  const eurusd = getAsset(assets, 'eurusd');
  const nasdaq = getAsset(assets, 'nasdaq');
  const sp500 = getAsset(assets, 'sp500');
  const dowjones = getAsset(assets, 'dowjones');

  const proxyPriceLines = [
    proxyPriceLine('📊', 'nasdaq', nasdaq),
    proxyPriceLine('🇺🇸', 'sp500', sp500),
    ...(dowjones ? [proxyPriceLine('📊', 'dowjones', dowjones)] : []),
  ];

  return [
    `₿ BTC : ${priceAndMove(btc)}`,
    `♦️ ETH : ${priceAndMove(eth)}`,
    `🥇 Gold : ${priceAndMove(gold)}`,
    `💱 EUR/USD : ${priceAndMove(eurusd)}`,
    ...proxyPriceLines,
  ].join('\n');
}

function buildUsefulReading(intelligence: MarketIntelligenceResult): string {
  if (intelligence.mood === 'risk-off') {
    return 'Le signal dominant reste défensif. Une amélioration viendrait surtout d’un rebond des proxies US et d’une baisse du stress marché.';
  }

  if (intelligence.mood === 'risk-on') {
    return 'Le signal dominant reste constructif. Le contexte se dégraderait surtout si les proxies US perdaient leur soutien ou si le stress marché repartait à la hausse.';
  }

  if (intelligence.mood === 'mixed') {
    return 'Le marché manque d’alignement. Il vaut mieux attendre une confirmation des proxies US, du dollar ou du stress marché.';
  }

  return 'Le marché reste équilibré. Aucun signal dominant ne ressort clairement pour l’instant.';
}

function formatCorrelationSeverity(severity: string): string {
  if (severity === 'strong') return '🔴';
  if (severity === 'watch') return '🟡';
  return '🔵';
}

function buildCorrelationInsights(intelligence: MarketIntelligenceResult): string {
  if (!intelligence.correlations || intelligence.correlations.length === 0) {
    return 'Aucune corrélation dominante détectée pour le moment.';
  }

  return intelligence.correlations
    .slice(0, 3)
    .map((correlation) => {
      const icon = formatCorrelationSeverity(correlation.severity);
      const title = normalizeMarketPulseWording(correlation.title);
      const summary = normalizeMarketPulseWording(correlation.summary);
      const impact = normalizeMarketPulseWording(correlation.impact);
      return `${icon} **${title}** — ${summary}\n${impact}`;
    })
    .join('\n\n');
}

function protectMarketPulseField(field: APIEmbedField): APIEmbedField {
  if (field.name === '📊 Vue rapide') {
    return { ...field, value: protectMarketPulseQuickViewValue(field.value) };
  }

  if (field.name === '📌 Prix clés') {
    return { ...field, value: protectMarketPulsePriceKeysValue(field.value) };
  }

  if (['🧭 Lecture rapide', '🔥 À retenir', '🔗 Corrélations utiles', '🎯 Lecture Radar'].includes(field.name)) {
    return { ...field, value: normalizeMarketPulseWording(field.value) };
  }

  return field;
}

function buildFields(assets: AssetMoveInput[], intelligence: MarketIntelligenceResult): APIEmbedField[] {
  return [
    {
      name: '🧭 Lecture rapide',
      value: buildExecutiveSummary(assets, intelligence),
      inline: false,
    },
    {
      name: '🔥 À retenir',
      value: buildKeyTakeaways(assets),
      inline: false,
    },
    {
      name: '📊 Vue rapide',
      value: buildQuickView(assets),
      inline: false,
    },
    {
      name: '📌 Prix clés',
      value: buildPrices(assets),
      inline: false,
    },
    {
      name: '🔗 Corrélations utiles',
      value: buildCorrelationInsights(intelligence),
      inline: false,
    },
    {
      name: '🎯 Lecture Radar',
      value: buildUsefulReading(intelligence),
      inline: false,
    },
    {
      name: '🌍 Sources',
      value: formatSources(assets),
      inline: false,
    },
  ].map(protectMarketPulseField);
}

async function fetchPulseAssets(): Promise<AssetMoveInput[]> {
  const assets: AssetMoveInput[] = [];

  for (const registryAsset of getMarketPulseAssets()) {
    const assetName = registryAsset.id;
    try {
      const quote = await getAssetPrice(assetName);

      if (!quote || quote.price === null || quote.status === 'closed' || quote.status === 'unavailable') {
        continue;
      }

      assets.push({
        asset: quote.asset,
        displayName: quote.displayName,
        price: quote.price,
        changeShortTerm: quote.change24h ?? 0,
        change1h: null,
        change24h: quote.change24h ?? null,
        source: quote.source,
      });
    } catch {
      continue;
    }
  }

  return assets;
}

function isIgnorableDiscordInteractionError(error: unknown): boolean {
  const code = (error as { code?: number })?.code;

  return code === 10062 || code === 40060;
}

async function safeRespond(interaction: ChatInputCommandInteraction, payload: any): Promise<void> {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
      return;
    }

    await interaction.reply(payload);
  } catch (error) {
    if (isIgnorableDiscordInteractionError(error)) {
      logger.warn({ error }, 'Interaction Discord /market-pulse expirée ou déjà traitée');
      return;
    }

    throw error;
  }
}

export const marketPulseCommand = {
  data: new SlashCommandBuilder()
    .setName('market-pulse')
    .setDescription('Affiche une synthèse claire du contexte marché.'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      try {
        await interaction.deferReply();
      } catch (error) {
        if (isIgnorableDiscordInteractionError(error)) {
          logger.warn({ error }, 'Interaction /market-pulse expirée avant deferReply');
          return;
        }

        throw error;
      }

      const assets = await fetchPulseAssets();
      const intelligence = analyzeMarketContext(buildMarketContext(assets));

      const embed = createMarketEmbed({
        title: '🧠 Market Pulse — Le Radar',
        description: [
          `**${getMoodTitle(intelligence.mood)}**`,
          `Score Radar : **${intelligence.score} / 5**`,
          getBiasLabel(intelligence.mood),
          '',
          'Information éducative uniquement. Aucun conseil financier.',
        ].join('\n'),
        fields: buildFields(assets, intelligence),
      });

      await safeRespond(interaction, { embeds: [embed] });
    } catch (error) {
      logger.error({ error }, 'Erreur commande /market-pulse');

      await safeRespond(interaction, {
        embeds: [createErrorEmbed('Impossible de construire le radar marché pour le moment.')],
      });
    }
  },
};
