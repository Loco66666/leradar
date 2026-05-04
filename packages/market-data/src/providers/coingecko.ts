export async function getCryptoPrice(symbol: string) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbol}`,
  );

  if (!response.ok) {
    throw new Error(`Erreur CoinGecko: HTTP ${response.status}`);
  }

  const data = (await response.json()) as Array<Record<string, number | string | null>>;
  const first = data[0];

  if (!first) {
    throw new Error(`Erreur CoinGecko: aucune donnée pour ${symbol}`);
  }

  const price = Number(first.current_price);
  const change24h = Number(first.price_change_percentage_24h);
  const volume = Number(first.total_volume);

  if (!Number.isFinite(price)) {
    throw new Error(`Erreur CoinGecko: prix invalide pour ${symbol}`);
  }

  return {
    asset: symbol,
    price,
    change24h: Number.isFinite(change24h) ? change24h : null,
    volume: Number.isFinite(volume) ? volume : null,
    source: 'CoinGecko',
    timestamp: new Date().toISOString(),
  };
}
