import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { helpCommand } from './commands/help.js';
import { priceCommand } from './commands/price.js';
import { fearGreedCommand } from './commands/fearGreed.js';
import { marketPulseCommand } from './commands/marketPulse.js';
import { newsCommand } from './commands/news.js';
import { analyseCommand } from './commands/analyse.js';

const commands = [
  helpCommand.data.toJSON(),
  priceCommand.data.toJSON(),
  fearGreedCommand.data.toJSON(),
  marketPulseCommand.data.toJSON(),
  newsCommand.data.toJSON(),
  analyseCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

console.log('Déploiement des commandes slash Le Radar...');

await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
  body: commands,
});

console.log('Commandes slash déployées avec succès.');
