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

function priceAndMove(asset: AssetMoveInput | undefined): string {
  if (!asset) return 'N/A';
  return `${formatPrice(asset.asset, asset.price)} · ${formatPercent(asset.change24h)}`;
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
  const indicesWeak = Boolean((nasdaq?.change24h ?? 0) < 0 || (sp500?.change24h ?? 0) < 0);
  const dollarFirm = Boolean((eurusd?.change24h ?? 0) < -0.15);

  if (intelligence.mood === 'risk-off') {
    return [
      `Le marché montre une attitude prudente : ${indicesWeak ? 'les indices US reculent' : 'les indices manquent de force'}, ${dollarFirm ? 'le dollar semble plus ferme' : 'le dollar ne donne pas encore de signal clair'}, et le stress marché est ${stress}.`,
      cryptoPositive
        ? 'Les cryptos résistent encore, mais le contexte global reste fragile.'
        : 'Les cryptos ne compensent pas la pression observée sur le reste du marché.',
    ].join(' ');
  }

  if (intelligence.mood === 'risk-on') {
    return [
      'Le marché montre un climat plus constructif : les actifs risqués sont mieux orientés et la pression globale reste contenue.',
      'Le contexte reste favorable tant que les indices tiennent et que le stress marché ne réaccélère pas.',
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

  const points: string[] = [];

  if ((nasdaq?.change24h ?? 0) < 0 || (sp500?.change24h ?? 0) < 0) {
    points.push(`• Les indices US sont sous pression : Nasdaq ${moveText(nasdaq)}, S&P500 ${moveText(sp500)}.`);
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

  return [
    `**Crypto** : BTC ${moveText(btc)} · ETH ${moveText(eth)}`,
    `**Indices US** : Nasdaq ${moveText(nasdaq)} · S&P500 ${moveText(sp500)}`,
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

  return [
    `₿ BTC : ${priceAndMove(btc)}`,
    `♦️ ETH : ${priceAndMove(eth)}`,
    `🥇 Gold : ${priceAndMove(gold)}`,
    `💱 EUR/USD : ${priceAndMove(eurusd)}`,
    `📊 Nasdaq : ${priceAndMove(nasdaq)}`,
    `🇺🇸 S&P500 : ${priceAndMove(sp500)}`,
  ].join('\n');
}

function buildUsefulReading(intelligence: MarketIntelligenceResult): string {
  if (intelligence.mood === 'risk-off') {
    return 'Le signal dominant reste défensif. Une amélioration viendrait surtout d’un rebond des indices et d’une baisse du stress marché.';
  }

  if (intelligence.mood === 'risk-on') {
    return 'Le signal dominant reste constructif. Le contexte se dégraderait surtout si les indices perdaient leur soutien ou si le stress marché repartait à la hausse.';
  }

  if (intelligence.mood === 'mixed') {
    return 'Le marché manque d’alignement. Il vaut mieux attendre une confirmation des indices, du dollar ou du stress marché.';
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
      return `${icon} **${correlation.title}** — ${correlation.summary}\n${correlation.impact}`;
    })
    .join('\n\n');
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
  ];
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

export const marketPulseCommand = {
  data: new SlashCommandBuilder()
    .setName('market-pulse')
    .setDescription('Affiche une synthèse claire du contexte marché.'),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

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

      await interaction.editReply({ embeds: [embed] });
    } catch {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Impossible de construire le radar marché pour le moment.')],
        });
        return;
      }

      await interaction.reply({
        embeds: [createErrorEmbed('Impossible de construire le radar marché pour le moment.')],
      });
    }
  },
};
