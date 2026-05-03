import { askOpenAI } from './openaiClient.js';
import { sanitizeAnswer } from './safety.js';

export async function analyseMarketQuestion(question: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    return `Contexte marché: API IA non configurée\nFacteurs possibles: indisponible\nNiveaux ou éléments à surveiller: indisponible\nRisques: volatilité\nConclusion éducative: activez OPENAI_API_KEY.`;
  }
  const prompt = `Réponds en français et structure strictement en 5 sections: Contexte marché, Facteurs possibles, Niveaux ou éléments à surveiller, Risques, Conclusion éducative. Interdiction totale de donner des conseils d'achat/vente. Question: ${question}`;
  const data = (await askOpenAI(prompt, apiKey)) as { output_text?: string };
  return sanitizeAnswer(data.output_text ?? 'Réponse indisponible');
}
