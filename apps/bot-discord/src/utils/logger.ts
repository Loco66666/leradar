import pino from 'pino';

export const logger = pino({ name: 'le-radar', level: process.env.LOG_LEVEL ?? 'info' });
