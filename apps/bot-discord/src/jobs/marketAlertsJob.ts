import { prisma } from '../../../../packages/database/src/index.js';
import { getMarketPulse } from '../../../../packages/market-data/src/marketService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function runMarketAlertsJob() {
  const pulse = await getMarketPulse();
  for (const asset of [pulse.btc, pulse.eth]) {
    const last = await prisma.marketSnapshot.findFirst({ where: { asset: asset.asset }, orderBy: { createdAt: 'desc' } });
    if (last) {
      const change = ((asset.price - last.price) / last.price) * 100;
      if (Math.abs(change) >= env.ALERT_THRESHOLD_PERCENT) {
        logger.warn({ asset: asset.asset, change }, 'Alerte variation forte');
      }
    }
    await prisma.marketSnapshot.create({ data: { asset: asset.asset, price: asset.price, source: asset.source } });
  }
}
