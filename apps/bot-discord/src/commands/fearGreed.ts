import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getFearGreedIndex } from '@leradar/market-data/providers/fearGreed';

export const fearGreedCommand = { data: new SlashCommandBuilder().setName('fear-greed').setDescription('Indice Fear & Greed'), async execute(interaction: ChatInputCommandInteraction) { const fg = await getFearGreedIndex(); await interaction.reply(`Fear & Greed: ${fg.value} (${fg.classification}) - ${fg.timestamp}`);} };
