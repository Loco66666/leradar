import { askOpenAI } from './openaiClient.js';
import { sanitizeAnswer } from './safety.js';

type AnalyseMarketOptions = {
  marketContext?: string;
  focusedAsset?: string | null;
};

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

export async function analyseMarketQuestion(
  question: string,
  apiKey?: string,
  options: AnalyseMarketOptions = {},
): Promise<string> {
  const cleanQuestion = question.trim().slice(0, 800);
  const focusedAsset = options.focusedAsset ?? 'non détecté précisément';
  const marketContext = options.marketContext?.trim()
    ? options.marketContext.trim().slice(0, 2500)
    : 'Contexte marché Le Radar indisponible pour cette demande.';

  if (!apiKey) {
    return fallbackAnswer;
  }

  const prompt = `
Tu es l’analyste éducatif officiel du projet Le Radar.

Mission :
Répondre en français impeccable à une question de marché financier.
Tu aides l’utilisateur à comprendre le contexte, jamais à suivre un signal.

Question utilisateur :
"${cleanQuestion}"

Actif probablement concerné :
${focusedAsset}

Contexte marché fourni par Le Radar :
${marketContext}

Style attendu :
- Premium, clair, naturel, sérieux.
- Tu dois relier l’actif demandé au contexte global.
- Tu dois expliquer les contradictions si elles existent.
- Exemple : "BTC monte, mais le contexte global reste défensif" si c’est cohérent avec les données.
- Pas de jargon inutile.
- Pas de blabla générique.
- Réponse utile même pour quelqu’un d’intermédiaire.

Règles absolues :
- Ne donne jamais d’ordre d’achat ou de vente.
- Ne promets jamais de gain.
- Ne dis jamais "signal".
- Ne dis jamais "achète", "vends", "entre maintenant" ou équivalent.
- Ne donne pas de prix d’entrée, stop loss ou take profit.
- Ne transforme jamais l’analyse en recommandation.
- Si l’information manque, explique-le honnêtement.
- Donne plusieurs lectures possibles si nécessaire.

Structure obligatoire :

📌 **Contexte global**
Explique le climat marché Le Radar : constructif, défensif, mitigé ou neutre.

📊 **Lecture de l’actif**
Explique ce que montre l’actif demandé dans ce contexte.

🔗 **Corrélations utiles**
Explique les relations importantes : indices, dollar, or, stress marché, crypto.

👀 **Éléments à surveiller**
Donne des éléments concrets à observer, sans inciter à trader.

⚠️ **Risques de lecture**
Explique ce qui peut invalider ou nuancer l’analyse.

🔀 **Scénarios possibles**
Présente 2 ou 3 scénarios éducatifs, sans incitation à prendre position.

🎯 **Conclusion éducative**
Résumé court, neutre et responsable.
`;

  const data = (await askOpenAI(prompt, apiKey)) as { output_text?: string };
  return sanitizeAnswer(data.output_text ?? 'Analyse momentanément indisponible.');
}
