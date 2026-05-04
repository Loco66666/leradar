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
import { logger } from './utils/logger.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = new Map([
  [helpCommand.data.name, helpCommand],
  [priceCommand.data.name, priceCommand],
  [fearGreedCommand.data.name, fearGreedCommand],
  [marketPulseCommand.data.name, marketPulseCommand],
  [newsCommand.data.name, newsCommand],
  [analyseCommand.data.name, analyseCommand],
]);

client.once('clientReady', () => {
  onReady(client);

  logger.info('[ALERTS] Job alertes marché démarré');

  void runMarketAlertsJob(client);

  setInterval(() => {
    void runMarketAlertsJob(client);
  }, 5 * 60 * 1000);
});

registerInteractionHandler(client, commands);

void client.login(env.DISCORD_TOKEN);
