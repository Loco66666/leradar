import { Client } from 'discord.js';
import { logger } from '../utils/logger.js';

export function onReady(client: Client) {
  logger.info(`Connecté en tant que ${client.user?.tag}`);
}
