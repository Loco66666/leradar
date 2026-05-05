import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAssetPrice } from '@leradar/market-data';
import { createErrorEmbed, createMarketEmbed, EMBED_COLORS, formatNumber, formatUsd } from '../utils/embedFactory.js';
import { logger } from '../utils/logger.js';

type MarketBias = {
  label: string;
  tone: string;
};

function getBias(change24h: number | null): MarketBias {
  if (change24h === null) {
    return {
      label: '⚪ Tendance neutre',
      tone: 'Donnée insuffisante pour qualifier la dynamique actuelle.',
    };
  }

  if (change24h > 0.3) {
    return {
      label: '🟢 Tendance positive',
      tone: 'Le marché conserve une dynamique constructive à court terme.',
    };
  }

  if (change24h < -0.3) {
    return {
      label: '🔴 Tendance négative',
      tone: 'Le marché montre une pression vendeuse à court terme.',
    };
  }

  return {
    label: '⚪ Tendance neutre',
    tone: 'Le marché évolue sans impulsion directionnelle marquée.',
  };
}

function getReading(asset: string, change24h: number | null): string {
  if (change24h === null) return 'Lecture limitée : certaines données de variation ne sont pas disponibles.';

  if (asset === 'vix') {
    if (change24h > 1) return 'La volatilité progresse : le marché adopte une posture plus défensive.';
    if (change24h < -1) return 'La volatilité recule : l’appétit pour le risque s’améliore légèrement.';
    return 'La volatilité reste contenue, sans stress majeur détecté.';
  }

  if (asset === 'dxy') {
    if (change24h > 0.3) return 'Le dollar se renforce, ce qui peut peser sur les actifs risqués et les métaux.';
    if (change24h < -0.3) return 'Le dollar s’affaiblit, ce qui peut soutenir les actifs risqués et les métaux.';
    return 'Le dollar reste stable, sans pression macroéconomique évidente.';
  }

  if (change24h > 1) return 'Momentum positif visible, à surveiller sans extrapoler.';
  if (change24h < -1) return 'Pression vendeuse visible, prudence sur les excès de volatilité.';
  return 'Marché stable : aucune impulsion forte ne ressort pour le moment.';
}

function getActivity(change24h: number | null): string {
  if (change24h === null) return 'Non déterminée';
  const abs = Math.abs(change24h);
  if (abs >= 3) return 'Volatilité élevée';
  if (abs >= 1) return 'Mouvement notable';
  return 'Stable';
}

function formatStatus(status: string): string {
  if (status === 'live') return 'Temps réel';
  if (status === 'delayed') return 'Différé';
  if (status === 'closed') return 'Marché fermé';
  if (status === 'unavailable') return 'Indisponible';
  return status;
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value)}%`;
}

function formatCompact(value: number | null): string {
  if (value === null) return 'N/A';

  const abs = Math.abs(value);
  const formatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  });

  if (abs >= 1_000_000_000) return `${formatter.format(value / 1_000_000_000)} Md`;
  if (abs >= 1_000_000) return `${formatter.format(value / 1_000_000)} M`;
  if (abs >= 1_000) return `${formatter.format(value / 1_000)} k`;

  return formatter.format(value);
}

function formatMarketPrice(asset: string, price: number | null): string {
  if (price === null) return 'N/A';

  const forexAssets = [
    'eurusd',
    'gbpusd',
    'usdjpy',
    'usdchf',
    'audusd',
    'nzdusd',
    'usdcad',
    'eurgbp',
    'eurjpy',
    'gbpjpy',
    'audjpy',
    'cadjpy',
    'chfjpy',
    'eurchf',
    'euraud',
    'eurcad',
    'gbpaud',
    'gbpcad',
  ];
  const indexAssets = ['nasdaq', 'sp500', 'dxy', 'vix'];

  if (forexAssets.includes(asset)) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: asset === 'usdjpy' ? 2 : 4,
      maximumFractionDigits: asset === 'usdjpy' ? 3 : 5,
    }).format(price);
  }

  if (indexAssets.includes(asset)) {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
    }).format(price);
  }

  if (['gold', 'silver'].includes(asset)) {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
    }).format(price)} $ / oz`;
  }

  if (asset === 'brent') {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
    }).format(price)} $ / baril`;
  }

  return formatUsd(price);
}

function formatSource(source: string): string {
  if (source.includes('(QQQ)')) return 'Twelve Data • Proxy Nasdaq via QQQ';
  if (source.includes('(SPY)')) return 'Twelve Data • Proxy S&P 500 via SPY';
  if (source.includes('(VIXY)')) return 'Twelve Data • Proxy volatilité via VIXY';
  return source;
}

function colorFromChange(change24h: number | null) {
  if (change24h === null) return EMBED_COLORS.market;
  if (change24h > 0.05) return EMBED_COLORS.success;
  if (change24h < -0.05) return EMBED_COLORS.error;
  return EMBED_COLORS.market;
}

function formatDiscordTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return 'Mise à jour récente';
  }

  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:R>`;
}

async function respond(interaction: ChatInputCommandInteraction, payload: any) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
    return;
  }

  await interaction.reply(payload);
}

export const priceCommand = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription("Affiche une fiche marché premium pour un actif")
    .addStringOption((option) =>
      option
        .setName('asset')
        .setDescription('Exemples : btc, gold, nasdaq, eurusd, dxy, vix')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const asset = interaction.options.getString('asset', true).trim().toLowerCase();

    try {
      const data = await getAssetPrice(asset);

      if (!data) {
        await respond(interaction, {
          embeds: [
            createErrorEmbed(
              'Actif non reconnu.\n\nExemples : btc, eth, sol, gold, silver, eurusd, gbpusd, usdjpy, nasdaq, sp500, nvda, qqq',
            ),
          ],
        });
        return;
      }

      if (data.status === 'unavailable' || data.price === null) {
        await respond(interaction, {
          embeds: [createErrorEmbed('🔄 Donnée momentanément indisponible pour cet actif.')],
        });
        return;
      }

      const bias = getBias(data.change24h);
      const reading = getReading(data.asset, data.change24h);
      const activity = getActivity(data.change24h);

      const embed = createMarketEmbed({
        title: `📈 Fiche Marché • ${data.displayName}`,
        description: [
          `**${bias.label}**`,
          bias.tone,
          '',
          `**Lecture Le Radar :** ${reading}`,
          '',
          'Information éducative uniquement. Aucun signal d’achat ou de vente.',
        ].join('\n'),
        color: colorFromChange(data.change24h),
        fields: [
          { name: '💰 Prix', value: formatMarketPrice(data.asset, data.price), inline: true },
          { name: '📊 Variation 24h', value: formatPercent(data.change24h), inline: true },
          { name: '🌡️ Dynamique', value: activity, inline: true },
          { name: '📉 Bas jour', value: formatMarketPrice(data.asset, data.dayLow), inline: true },
          { name: '📈 Haut jour', value: formatMarketPrice(data.asset, data.dayHigh), inline: true },
          { name: '📦 Volume', value: formatCompact(data.volume), inline: true },
          { name: '🌍 Source', value: formatSource(data.source), inline: true },
          { name: '⚡ Donnée', value: formatStatus(data.status), inline: true },
          { name: '🕒 Mise à jour', value: formatDiscordTimestamp(data.timestamp), inline: true },
        ],
      });

      await respond(interaction, { embeds: [embed] });
    } catch (error) {
      logger.error({ error, asset }, 'Erreur commande /price');

      await respond(interaction, {
        embeds: [createErrorEmbed('🔄 Donnée momentanément indisponible pour cet actif.')],
      });
    }
  },
};
