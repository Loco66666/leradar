import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../utils/embedFactory.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher les commandes Le Radar'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = createInfoEmbed({
      title: '🛰️ Centre de Commande Le Radar',
      description:
        'Le Radar vous aide à comprendre les marchés, pas à suivre des promesses.',
      fields: [
        {
          name: '📈 Marchés',
          value: '`/price`\n`/fear-greed`\n`/market-pulse`',
          inline: true,
        },
        { name: '🧠 Analyse IA', value: '`/analyse`', inline: true },
        { name: '📰 Actualité', value: '`/news`', inline: true },
        {
          name: '🎓 Éducation (bientôt)',
          value: '`/formation`\n`/journal`\n`/simulateur`',
          inline: false,
        },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
