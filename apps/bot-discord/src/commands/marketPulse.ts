import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getMarketPulse } from '@leradar/market-data';
import { createErrorEmbed, createMarketEmbed, formatUsd } from '../utils/embedFactory.js';

function pulseReading(trend: string): string {
  if (trend === 'risk-on') return 'Les actifs risqués restent recherchés aujourd’hui.';
  if (trend === 'risk-off') return 'Le marché montre une posture défensive.';
  return 'Le marché évolue sans biais directionnel net.';
}

export const marketPulseCommand = {
  data: new SlashCommandBuilder().setName('market-pulse').setDescription('Résumé marché'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const p = await getMarketPulse();
      const embed = createMarketEmbed({
        title: '🛰️ Radar Marché',
        description: pulseReading(p.trend),
        fields: [
          { name: '₿ Bitcoin', value: formatUsd(p.btc.price), inline: true },
          { name: 'Ξ Ethereum', value: formatUsd(p.eth.price), inline: true },
          { name: '😨 Fear & Greed', value: `${p.fearGreed.value}/100`, inline: true },
          { name: '⚡ Climat global', value: p.trend, inline: true },
        ],
      });
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [createErrorEmbed('Impossible de construire le radar marché pour le moment.')] });
    }
  },
};
