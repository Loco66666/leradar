export type MarketPulseUsProxyAsset = 'nasdaq' | 'sp500' | 'dowjones';

type MarketPulseProxyPresentation = {
  shortLabel: string;
  detailLabel: string;
  unit: '$US';
};

export const MARKET_PULSE_US_PROXY_PRESENTATIONS: Record<MarketPulseUsProxyAsset, MarketPulseProxyPresentation> = {
  nasdaq: {
    shortLabel: 'QQQ',
    detailLabel: 'Proxy Nasdaq / QQQ',
    unit: '$US',
  },
  sp500: {
    shortLabel: 'SPY',
    detailLabel: 'Proxy S&P 500 / SPY',
    unit: '$US',
  },
  dowjones: {
    shortLabel: 'DIA',
    detailLabel: 'Proxy Dow Jones / DIA',
    unit: '$US',
  },
};

export function getMarketPulseUsProxyPresentation(asset: string): MarketPulseProxyPresentation | null {
  const key = asset.toLowerCase() as MarketPulseUsProxyAsset;

  return MARKET_PULSE_US_PROXY_PRESENTATIONS[key] ?? null;
}

export function isMarketPulseUsProxy(asset: string): boolean {
  return getMarketPulseUsProxyPresentation(asset) !== null;
}

export function getMarketPulseShortLabel(asset: string): string {
  return getMarketPulseUsProxyPresentation(asset)?.shortLabel ?? asset;
}

export function getMarketPulseDetailLabel(asset: string): string {
  return getMarketPulseUsProxyPresentation(asset)?.detailLabel ?? asset;
}

export function getMarketPulsePriceUnit(asset: string): '$US' | 'pts' {
  return getMarketPulseUsProxyPresentation(asset)?.unit ?? 'pts';
}

export function formatMarketPulseProxyPrice(asset: string, value: number | null): string | null {
  const presentation = getMarketPulseUsProxyPresentation(asset);

  if (!presentation) return null;
  if (value === null || !Number.isFinite(value)) return 'N/A';

  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: value > 100 ? 2 : 5,
  }).format(value);

  return `${formatted} ${presentation.unit}`;
}

function sanitizeProxyPriceLine(line: string, icon: string, oldLabelPattern: RegExp, detailLabel: string): string {
  if (!oldLabelPattern.test(line)) return line;

  return line.replace(oldLabelPattern, `${icon} ${detailLabel} :`).replace(/ pts(?=\s*·)/g, ' $US');
}

export function protectMarketPulseQuickViewValue(value: string): string {
  return value
    .split('\n')
    .map((line) => {
      if (!/^\*\*(Indices US|Proxies US)\*\*\s*:/.test(line)) return line;

      return line
        .replace(/^\*\*Indices US\*\*/, '**Proxies US**')
        .replace(/\bNasdaq\b/g, MARKET_PULSE_US_PROXY_PRESENTATIONS.nasdaq.shortLabel)
        .replace(/\bS&P\s?500\b/g, MARKET_PULSE_US_PROXY_PRESENTATIONS.sp500.shortLabel)
        .replace(/\bDow Jones\b/g, MARKET_PULSE_US_PROXY_PRESENTATIONS.dowjones.shortLabel);
    })
    .join('\n');
}

export function protectMarketPulsePriceKeysValue(value: string): string {
  return value
    .split('\n')
    .map((line) => {
      const nasdaqLine = sanitizeProxyPriceLine(
        line,
        '📊',
        /^📊\s*(?:Nasdaq|Proxy Nasdaq \/ QQQ)\s*:/,
        MARKET_PULSE_US_PROXY_PRESENTATIONS.nasdaq.detailLabel,
      );
      const sp500Line = sanitizeProxyPriceLine(
        nasdaqLine,
        '🇺🇸',
        /^🇺🇸\s*(?:S&P\s?500|Proxy S&P 500 \/ SPY)\s*:/,
        MARKET_PULSE_US_PROXY_PRESENTATIONS.sp500.detailLabel,
      );

      return sanitizeProxyPriceLine(
        sp500Line,
        '📊',
        /^📊\s*(?:Dow Jones|Proxy Dow Jones \/ DIA)\s*:/,
        MARKET_PULSE_US_PROXY_PRESENTATIONS.dowjones.detailLabel,
      );
    })
    .join('\n');
}
