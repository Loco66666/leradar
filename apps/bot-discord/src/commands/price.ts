import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAssetPrice } from '@leradar/market-data';
import { createErrorEmbed, createMarketEmbed, formatNumber, formatUsd } from '../utils/embedFactory.js';

function marketInterpretation(change24h: number | null): string {
  if (change24h === null) return 'Marché stable pour le moment.';
  if (change24h > 0.2) return 'Tendance du jour positive.';
  if (change24h < -0.2) return 'Pression vendeuse à court terme.';
  return 'Marché stable pour le moment.';
}

export const priceCommand = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription("Prix d'un actif")
    .addStringOption((o) =>
      o.setName('asset').setDescription('Actif (ex: btc, eth, gold)').setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const asset = interaction.options.getString('asset', true);
    try {
      const data = await getAssetPrice(asset);
      const embed = createMarketEmbed({
        title: `📈 Fiche Marché • ${data.asset}`,
        description: marketInterpretation(data.change24h),
        fields: [
          { name: '💰 Prix actuel', value: formatUsd(data.price), inline: true },
          { name: '📈 Variation 24h', value: `${formatNumber(data.change24h)}%`, inline: true },
          { name: '📊 Volume', value: formatNumber(data.volume, 0), inline: true },
          { name: '🌍 Source', value: data.source, inline: true },
          { name: '🕒 Dernière mise à jour', value: `<t:${Math.floor(new Date(data.timestamp).getTime() / 1000)}:R>`, inline: true },
        ],
      });
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [createErrorEmbed('Impossible de récupérer le prix pour cet actif.')] });
    }
  },
};
