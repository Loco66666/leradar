export async function askOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
    }),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'Erreur OpenAI API');
  }

  const outputText =
    data.output_text ??
    data.output
      ?.flatMap((item: any) => item.content ?? [])
      ?.map((content: any) => content.text ?? '')
      ?.join('\n')
      ?.trim();

  return {
    output_text: outputText || 'Analyse momentanément indisponible.',
  };
}
