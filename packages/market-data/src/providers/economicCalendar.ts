export interface EconomicEvent {
  title: string;
  impact: 'low' | 'medium' | 'high';
  date: string;
}

export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  return [];
}
