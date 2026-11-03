import { m } from "$lib/i18n";

export const MAX_PREFIX_LENGTH = 10;

/** The reason a prefix would be refused, matching the bot's rule, or null when it is fine. */
export function prefixError(prefix: string): string | null {
  if (!prefix) return m.pokefluxMarket.prefixRequired();
  if (/\s/.test(prefix)) return m.pokefluxMarket.prefixNoSpaces();
  if (prefix.length > MAX_PREFIX_LENGTH) return m.pokefluxMarket.prefixTooLong({ max: MAX_PREFIX_LENGTH });
  return null;
}
