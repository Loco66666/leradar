import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getFearGreedIndex } from '@leradar/market-data/providers/fearGreed';
import { createErrorEmbed, createMarketEmbed } from '../utils/embedFactory.js';

function toBand(value: number): string {
  if (value <= 24) return 'Peur extrême';
  if (value <= 44) return 'Peur';
  if (value <= 55) return 'Neutre';
  if (value <= 74) return 'Optimisme';
  return 'Euphorie';
}

export const fearGreedCommand = {
  data: new SlashCommandBuilder().setName('fear-greed').setDescription('Indice Fear & Greed'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const fg = await getFearGreedIndex();
      const embed = createMarketEmbed({
        title: '😨 Fear & Greed Index',
        fields: [
          { name: 'Valeur', value: `${fg.value} / 100`, inline: true },
          { name: 'Interprétation', value: toBand(fg.value), inline: true },
          { name: 'Lecture', value: 'Les excès émotionnels créent souvent de la volatilité.', inline: false },
        ],
      });
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [createErrorEmbed("L'indice Fear & Greed est temporairement indisponible.")] });
    }
  },
};
