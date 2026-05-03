import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const newsCommand = { data: new SlashCommandBuilder().setName('news').setDescription('Actualités par sujet').addStringOption((o)=>o.setName('sujet').setDescription('Sujet').setRequired(true)), async execute(interaction: ChatInputCommandInteraction) { await interaction.reply('Module news en préparation. API non configurée pour le moment.'); } };
