import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { analyseMarketQuestion } from '@leradar/ai-engine';
import { env } from '../config/env.js';
import { createErrorEmbed, createInfoEmbed } from '../utils/embedFactory.js';
import { logger } from '../utils/logger.js';

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

      const answer = await analyseMarketQuestion(question, env.OPENAI_API_KEY);

      const embed = createInfoEmbed({
        title: '🧠 Analyse Le Radar',
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
