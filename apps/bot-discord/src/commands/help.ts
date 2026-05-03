import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder().setName('help').setDescription('Afficher les commandes Le Radar'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('**Le Radar** commandes: /help /price /fear-greed /market-pulse /news /analyse');
  },
};
