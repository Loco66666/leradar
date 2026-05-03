import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { analyseMarketQuestion } from '../../../../packages/ai-engine/src/analyseMarket.js';
import { env } from '../config/env.js';

export const analyseCommand = { data: new SlashCommandBuilder().setName('analyse').setDescription('Analyse éducative').addStringOption((o)=>o.setName('question').setDescription('Question').setRequired(true)), async execute(interaction: ChatInputCommandInteraction) { const q = interaction.options.getString('question', true); const answer = await analyseMarketQuestion(q, env.OPENAI_API_KEY); await interaction.reply(answer);} };
