import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { analyseMarketQuestion } from '@leradar/ai-engine';
import {
  analyzeMarketContext,
  type AssetMoveInput,
  type MarketContextInput,
  type MarketIntelligenceResult,
} from '@leradar/market-intelligence';
import { getAssetPrice } from '@leradar/market-data';
import { ASSET_REGISTRY, getMarketPulseAssets } from '@leradar/market-data/assetRegistry';
import { env } from '../config/env.js';
import { createErrorEmbed, createInfoEmbed, formatUsd } from '../utils/embedFactory.js';
import { logger } from '../utils/logger.js';

function detectFocusedAsset(question: string): string | null {
  const normalized = question.toLowerCase();

  for (const asset of ASSET_REGISTRY) {
    const candidates = [asset.id, asset.displayName, ...asset.aliases];

    if (candidates.some((candidate) => normalized.includes(candidate.toLowerCase()))) {
      return asset.id;
    }
  }

  return null;
}
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

function getMoodLabel(mood: MarketIntelligenceResult['mood']): string {
  switch (mood) {
    case 'risk-on':
      return 'constructif';
    case 'risk-off':
      return 'défensif';
    case 'mixed':
      return 'mitigé';
    case 'neutral':
    default:
      return 'neutre';
  }
}

function getAsset(assets: AssetMoveInput[], assetName: string): AssetMoveInput | undefined {
  return assets.find((asset) => asset.asset.toLowerCase() === assetName);
}

function formatCorrelationContext(intelligence: MarketIntelligenceResult): string {
  if (!intelligence.correlations.length) {
    return '- Aucune corrélation dominante détectée.';
  }

  return intelligence.correlations
    .slice(0, 4)
    .map((correlation) => `- ${correlation.title} : ${correlation.summary} ${correlation.impact}`)
    .join('\n');
}

function formatAssetsContext(assets: AssetMoveInput[]): string {
  return assets
    .map((asset) => {
      const stressLabel = asset.asset === 'vix' ? 'stress marché' : asset.displayName;
      return `- ${stressLabel} : ${formatPrice(asset.asset, asset.price)} | 24h ${formatPercent(asset.change24h)} | source ${asset.source}`;
    })
    .join('\n');
}

function buildContextSummary(
  assets: AssetMoveInput[],
  intelligence: MarketIntelligenceResult,
  focusedAsset: string | null,
): string {
  const focused = focusedAsset ? getAsset(assets, focusedAsset) : null;

  return [
    `Climat marché : ${getMoodLabel(intelligence.mood)}`,
    `Score Radar : ${intelligence.score} / 5`,
    '',
    'Résumé Le Radar :',
    intelligence.summary,
    '',
    focused
      ? `Actif ciblé détecté : ${focused.displayName} | Prix ${formatPrice(focused.asset, focused.price)} | 24h ${formatPercent(focused.change24h)}`
      : 'Actif ciblé détecté : aucun actif précis',
    '',
    'Actifs suivis :',
    formatAssetsContext(assets),
    '',
    'Facteurs de soutien :',
    intelligence.factors.length
      ? intelligence.factors.map((factor) => `- ${factor}`).join('\n')
      : '- Aucun soutien clair détecté.',
    '',
    'Risques à surveiller :',
    intelligence.risks.length
      ? intelligence.risks.map((risk) => `- ${risk}`).join('\n')
      : '- Aucun risque dominant détecté.',
    '',
    'Corrélations utiles :',
    formatCorrelationContext(intelligence),
  ].join('\n');
}

async function fetchAnalysisAssets(): Promise<AssetMoveInput[]> {
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
    } catch (error) {
      logger.warn({ error, assetName }, 'Contexte /analyse : actif ignoré');
    }
  }

  return assets;
}

export const analyseCommand = {
  data: new SlashCommandBuilder()
    .setName('analyse')
    .setDescription('Analyse éducative premium Le Radar')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Exemple : pourquoi le BTC baisse ?')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);

    try {
      await interaction.deferReply();

      const focusedAsset = detectFocusedAsset(question);
      const assets = await fetchAnalysisAssets();
      const intelligence = analyzeMarketContext(buildMarketContext(assets));
      const marketContext = buildContextSummary(assets, intelligence, focusedAsset);

      const answer = await analyseMarketQuestion(question, env.OPENAI_API_KEY, {
        focusedAsset,
        marketContext,
      });

      const focused = focusedAsset ? getAsset(assets, focusedAsset) : null;

      const embed = createInfoEmbed({
        title: focused
          ? `🧠 Analyse Radar — ${focused.displayName}`
          : '🧠 Analyse Radar — Le Radar',
        description: answer,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error({ error, question }, 'Erreur commande /analyse');

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Impossible de générer l’analyse actuellement.")],
        });
        return;
      }

      await interaction.reply({
        embeds: [createErrorEmbed("Impossible de générer l’analyse actuellement.")],
      });
    }
  },
};
