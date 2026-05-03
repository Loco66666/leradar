export async function getBinanceTicker(pair: string) {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
  if (!response.ok) throw new Error('Erreur Binance');
  return response.json();
}
