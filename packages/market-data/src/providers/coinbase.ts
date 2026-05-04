export async function getCoinbaseSpotPrice(productId: string) {
  const response = await fetch(`https://api.coinbase.com/v2/prices/${productId}/spot`);

  if (!response.ok) {
    throw new Error(`Erreur Coinbase: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      amount?: string;
      currency?: string;
      base?: string;
    };
  };

  const price = Number(payload.data?.amount);

  if (!Number.isFinite(price)) {
    throw new Error(`Erreur Coinbase: prix invalide pour ${productId}`);
  }

  return {
    price,
    source: `Coinbase (${productId})`,
    timestamp: new Date().toISOString(),
  };
}
