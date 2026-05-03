import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAssetPrice } from '@leradar/market-data';

export const priceCommand = {
  data: new SlashCommandBuilder().setName('price').setDescription('Prix d\'un actif').addStringOption((o)=>o.setName('asset').setDescription('Actif').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const asset = interaction.options.getString('asset', true);
    const data = await getAssetPrice(asset);
    await interaction.reply(`Actif: ${data.asset}\nPrix: ${data.price ?? 'N/A'}\nVar 24h: ${data.change24h ?? 'N/A'}\nVolume: ${data.volume ?? 'N/A'}\nSource: ${data.source}\nTimestamp: ${data.timestamp}\nInformation éducative, pas un conseil financier.`);
  },
};
