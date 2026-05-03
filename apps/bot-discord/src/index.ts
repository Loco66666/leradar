import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { onReady } from './events/ready.js';
import { registerInteractionHandler } from './events/interactionCreate.js';
import { helpCommand } from './commands/help.js';
import { priceCommand } from './commands/price.js';
import { fearGreedCommand } from './commands/fearGreed.js';
import { marketPulseCommand } from './commands/marketPulse.js';
import { newsCommand } from './commands/news.js';
import { analyseCommand } from './commands/analyse.js';
import { runMarketAlertsJob } from './jobs/marketAlertsJob.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = new Map([
  [helpCommand.data.name, helpCommand],
  [priceCommand.data.name, priceCommand],
  [fearGreedCommand.data.name, fearGreedCommand],
  [marketPulseCommand.data.name, marketPulseCommand],
  [newsCommand.data.name, newsCommand],
  [analyseCommand.data.name, analyseCommand],
]);

client.once('ready', () => onReady(client));
registerInteractionHandler(client, commands);
setInterval(() => void runMarketAlertsJob(), 5 * 60 * 1000);

void client.login(env.DISCORD_TOKEN);
