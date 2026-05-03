export async function getCryptoPrice(
  symbol: 'bitcoin' | 'ethereum' | 'solana' | 'binancecoin' | 'ripple',
) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbol}`,
  );
  if (!response.ok) throw new Error('Erreur CoinGecko');
  const [data] = (await response.json()) as Array<Record<string, number | string>>;
  return {
    asset: symbol,
    price: Number(data.current_price),
    change24h: Number(data.price_change_percentage_24h),
    volume: Number(data.total_volume),
    source: 'CoinGecko',
    timestamp: new Date().toISOString(),
  };
}
