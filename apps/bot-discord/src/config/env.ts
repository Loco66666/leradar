import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DATABASE_URL: z.string().default('file:./dev.db'),
  OPENAI_API_KEY: z.string().optional(),
  ALERT_CHANNEL_ID: z.string().optional(),
  ALERT_THRESHOLD_PERCENT: z.coerce.number().default(2),
});

export const env = envSchema.parse(process.env);
