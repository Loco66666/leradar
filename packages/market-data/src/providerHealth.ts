type ProviderHealthEntry = {
  failedAt: number;
  failures: number;
};

const providerFailures = new Map<string, ProviderHealthEntry>();

const COOLDOWN_BY_PROVIDER_MS: Record<string, number> = {
  coingecko: 60 * 1000,
  coinbase: 60 * 1000,
  twelveData: 2 * 60 * 1000,
  fmp: 5 * 60 * 1000,
  fmpCommodity: 5 * 60 * 1000,
};

export function isProviderCoolingDown(provider: string): boolean {
  const entry = providerFailures.get(provider);

  if (!entry) return false;

  const cooldown = COOLDOWN_BY_PROVIDER_MS[provider] ?? 2 * 60 * 1000;
  return Date.now() - entry.failedAt < cooldown;
}

export function markProviderFailure(provider: string): void {
  const current = providerFailures.get(provider);

  providerFailures.set(provider, {
    failedAt: Date.now(),
    failures: (current?.failures ?? 0) + 1,
  });
}

export function markProviderSuccess(provider: string): void {
  providerFailures.delete(provider);
}

export function getProviderCooldownReason(provider: string): string {
  const entry = providerFailures.get(provider);

  if (!entry) return `${provider} disponible`;

  const cooldown = COOLDOWN_BY_PROVIDER_MS[provider] ?? 2 * 60 * 1000;
  const remainingMs = Math.max(0, cooldown - (Date.now() - entry.failedAt));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return `${provider} en pause temporaire (${remainingSeconds}s restantes)`;
}
