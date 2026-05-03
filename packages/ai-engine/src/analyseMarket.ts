import { askOpenAI } from './openaiClient.js';
import { sanitizeAnswer } from './safety.js';

const fallbackAnswer = `📌 **Contexte**
Le module IA n’est pas encore configuré.

📊 **Facteurs probables**
Ajoutez une clé OPENAI_API_KEY pour activer les analyses avancées.

👀 **Éléments à surveiller**
Prix, volatilité, volume, contexte macroéconomique et calendrier économique.

⚠️ **Risques**
Les marchés peuvent évoluer rapidement. Toute analyse doit rester éducative.

🔀 **Scénarios possibles**
Le Radar pourra proposer plusieurs lectures possibles lorsque l’IA sera activée.

🎯 **Conclusion éducative**
Le Radar informe et aide à comprendre les marchés. Ce n’est pas un service de signaux.`;

export async function analyseMarketQuestion(question: string, apiKey?: string): Promise<string> {
  const cleanQuestion = question.trim().slice(0, 800);

  if (!apiKey) {
    return fallbackAnswer;
  }

  const prompt = `
Tu es l’analyste éducatif officiel du projet Le Radar.

Mission :
Répondre en français impeccable à une question de marché financier.
Tu aides l’utilisateur à comprendre, jamais à suivre un signal.

Question utilisateur :
"${cleanQuestion}"

Règles absolues :
- Ne donne jamais d’ordre d’achat ou de vente.
- Ne promets jamais de gain.
- Ne dis jamais "signal".
- Ne dis jamais "achète", "vends", "entre maintenant" ou équivalent.
- Reste clair, naturel, sérieux et pédagogique.
- Pas de jargon inutile.
- Si l’information manque, explique-le honnêtement.
- Donne plusieurs lectures possibles si nécessaire.

Structure obligatoire :

📌 **Contexte**
Explique rapidement la situation générale.

📊 **Facteurs probables**
Liste les facteurs qui peuvent expliquer le mouvement.

👀 **Éléments à surveiller**
Donne des éléments concrets à observer : zones, volatilité, volume, macro, sentiment.

⚠️ **Risques**
Explique ce qui peut invalider ou changer la lecture.

🔀 **Scénarios possibles**
Présente 2 ou 3 scénarios éducatifs, sans incitation à trader.

🎯 **Conclusion éducative**
Résumé court, neutre et responsable.
`;

  const data = (await askOpenAI(prompt, apiKey)) as { output_text?: string };
  return sanitizeAnswer(data.output_text ?? 'Analyse momentanément indisponible.');
}
