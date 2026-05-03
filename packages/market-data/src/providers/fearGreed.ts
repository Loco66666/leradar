export async function getFearGreedIndex() {
  const response = await fetch('https://api.alternative.me/fng/');
  if (!response.ok) throw new Error('Erreur Alternative.me');
  const payload = (await response.json()) as { data: Array<Record<string, string>> };
  const item = payload.data[0];
  return {
    value: Number(item.value),
    classification: item.value_classification,
    timestamp: new Date(Number(item.timestamp) * 1000).toISOString(),
    source: 'Alternative.me',
  };
}
