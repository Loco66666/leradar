import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getMarketPulse } from '@leradar/market-data';

export const marketPulseCommand = { data: new SlashCommandBuilder().setName('market-pulse').setDescription('Résumé marché'), async execute(interaction: ChatInputCommandInteraction) { const p = await getMarketPulse(); await interaction.reply(`BTC: ${p.btc.price} | ETH: ${p.eth.price} | Fear&Greed: ${p.fearGreed.value} | Tendance: ${p.trend}`);} };
