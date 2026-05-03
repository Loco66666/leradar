export type StooqPoint = {
  close: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  date: string;
};

function parseNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getStooqDailySeries(symbol: string): Promise<StooqPoint[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erreur Stooq');
  const text = await response.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('Série Stooq indisponible');

  return lines.slice(1).map((line) => {
    const [date, _open, high, low, close, volume] = line.split(',');
    return { date, high: parseNum(high), low: parseNum(low), close: parseNum(close), volume: parseNum(volume) };
  }).filter((p) => p.close !== null);
}
