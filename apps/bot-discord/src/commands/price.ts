import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAssetPrice } from '@leradar/market-data';
import { createErrorEmbed, createMarketEmbed, EMBED_COLORS, formatNumber, formatUsd } from '../utils/embedFactory.js';

function getReading(asset: string, change24h: number | null): string {
  if (asset === 'vix' && (change24h ?? 0) > 1) return 'Volatilité en hausse sur les marchés.';
  if (asset === 'dxy' && (change24h ?? 0) > 0.3) return 'Dollar soutenu actuellement.';
  if (change24h !== null && change24h > 1) return 'Tendance positive observée aujourd’hui.';
  if (change24h !== null && change24h < -1) return 'Pression vendeuse à court terme.';
  return 'Marché relativement stable actuellement.';
}

function getScore(change24h: number | null): '🟢 Haussier' | '🔴 Baissier' | '⚪ Neutre' {
  if (change24h === null) return '⚪ Neutre';
  if (change24h > 0.3) return '🟢 Haussier';
  if (change24h < -0.3) return '🔴 Baissier';
  return '⚪ Neutre';
}

function colorFromChange(change24h: number | null) {
  if (change24h === null) return EMBED_COLORS.market;
  if (change24h > 0.05) return EMBED_COLORS.success;
  if (change24h < -0.05) return EMBED_COLORS.error;
  return EMBED_COLORS.market;
}

export const priceCommand = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription("Prix d'un actif")
    .addStringOption((o) =>
      o
        .setName('asset')
        .setDescription('Exemples: btc, gold, nasdaq, eurusd, dxy')
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const asset = interaction.options.getString('asset', true);

    try {
      const data = await getAssetPrice(asset);
      if (!data) {
        await interaction.reply({
          embeds: [
            createErrorEmbed('Actif non reconnu.\n\nExemples : btc, gold, nasdaq, eurusd, dxy'),
          ],
        });
        return;
      }

      const score = getScore(data.change24h);
      const embed = createMarketEmbed({
        title: `📈 Fiche Marché • ${data.displayName}`,
        description: `Vue instantanée Le Radar\n${getReading(data.asset, data.change24h)}\n${score}`,
        color: colorFromChange(data.change24h),
        fields: [
          { name: '💰 Prix actuel', value: formatUsd(data.price), inline: true },
          { name: '📊 Variation', value: `${formatNumber(data.change24h)}%`, inline: true },
          { name: '📉 Plus bas jour', value: formatUsd(data.dayLow), inline: true },
          { name: '📈 Plus haut jour', value: formatUsd(data.dayHigh), inline: true },
          { name: '📦 Volume', value: formatNumber(data.volume, 0), inline: true },
          { name: '🌍 Source', value: data.source, inline: true },
          {
            name: '🕒 Mise à jour',
            value: `<t:${Math.floor(new Date(data.timestamp).getTime() / 1000)}:R>`,
            inline: true,
          },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({
        embeds: [createErrorEmbed('🔄 Donnée momentanément indisponible.')],
      });
    }
  },
};
