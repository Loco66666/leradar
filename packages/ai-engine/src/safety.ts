const bannedPatterns = [
  /\bach[eè]te\s+maintenant\b/gi,
  /\bvends\s+maintenant\b/gi,
  /\bentre\s+maintenant\b/gi,
  /\btrade\s+maintenant\b/gi,
  /profit garanti/gi,
  /gain garanti/gi,
  /position obligatoire/gi,
  /signal d['’]achat/gi,
  /signal de vente/gi,
];

export function sanitizeAnswer(answer: string): string {
  let output = answer.trim();

  for (const pattern of bannedPatterns) {
    output = output.replace(pattern, 'formulation non conforme retirée');
  }

  return output.slice(0, 3900);
}
