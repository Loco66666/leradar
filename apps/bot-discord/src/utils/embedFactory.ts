import { APIEmbedField, ColorResolvable, EmbedBuilder } from 'discord.js';

const BRAND_FOOTER =
  'Le Radar • Information éducative, pas un conseil financier';

export const EMBED_COLORS = {
  info: '#00d1ff',
  success: '#19c37d',
  warning: '#ff9f1a',
  error: '#ff4d4f',
  market: '#00d1ff',
} as const;

type BaseEmbedInput = {
  title: string;
  description?: string;
  fields?: APIEmbedField[];
  color?: ColorResolvable;
};

function baseEmbed({ title, description, fields, color }: BaseEmbedInput): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(color ?? EMBED_COLORS.info)
    .setTitle(title)
    .setTimestamp()
    .setFooter({ text: BRAND_FOOTER });

  if (description) embed.setDescription(description);
  if (fields?.length) embed.addFields(fields);

  return embed;
}

export function createInfoEmbed(input: BaseEmbedInput): EmbedBuilder {
  return baseEmbed({ ...input, color: input.color ?? EMBED_COLORS.info });
}

export function createSuccessEmbed(input: BaseEmbedInput): EmbedBuilder {
  return baseEmbed({ ...input, color: input.color ?? EMBED_COLORS.success });
}

export function createWarningEmbed(input: BaseEmbedInput): EmbedBuilder {
  return baseEmbed({ ...input, color: input.color ?? EMBED_COLORS.warning });
}

export function createErrorEmbed(description: string): EmbedBuilder {
  return baseEmbed({
    title: '❌ Donnée indisponible actuellement',
    description: `${description}\n\n🔄 Réessayez dans quelques instants.`,
    color: EMBED_COLORS.error,
  });
}

export function createMarketEmbed(input: BaseEmbedInput): EmbedBuilder {
  return baseEmbed({ ...input, color: input.color ?? EMBED_COLORS.market });
}

export function formatNumber(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatUsd(value: number | null): string {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
