import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { analyseMarketQuestion } from '@leradar/ai-engine';
import { env } from '../config/env.js';
import { createErrorEmbed, createInfoEmbed } from '../utils/embedFactory.js';

export const analyseCommand = {
  data: new SlashCommandBuilder()
    .setName('analyse')
    .setDescription('Analyse éducative')
    .addStringOption((o) => o.setName('question').setDescription('Question').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const q = interaction.options.getString('question', true);
    try {
      const answer = await analyseMarketQuestion(q, env.OPENAI_API_KEY);
      const embed = createInfoEmbed({
        title: '🧠 Analyse Le Radar',
        description: answer,
      });
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [createErrorEmbed("Impossible de générer l'analyse actuellement.")] });
    }
  },
};
