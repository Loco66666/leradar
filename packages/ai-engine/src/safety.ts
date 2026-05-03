const banned = ['achète', 'vends', 'signal', 'profit garanti', 'trade maintenant'];

export function sanitizeAnswer(answer: string): string {
  let output = answer;
  for (const word of banned) {
    const regex = new RegExp(word, 'gi');
    output = output.replace(regex, '[contenu retiré]');
  }
  return output;
}
