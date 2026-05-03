import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../utils/embedFactory.js';

export const newsCommand = {
  data: new SlashCommandBuilder()
    .setName('news')
    .setDescription('Actualités par sujet')
    .addStringOption((o) => o.setName('sujet').setDescription('Sujet').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = createInfoEmbed({
      title: '📰 Actualités Le Radar',
      description: 'Le module actualités en temps réel arrive prochainement.',
      fields: [{ name: 'Couverture prévue', value: 'Crypto • Forex • Indices • Macro • Matières premières' }],
    });
    await interaction.reply({ embeds: [embed] });
  },
};
