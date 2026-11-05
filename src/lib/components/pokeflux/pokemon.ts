import { getLocale, m } from "$lib/i18n";
import type { PokemonCard, PokemonList, PokemonListQuery } from "$lib/api";
import { proxyRequest } from "$lib/api/proxy";

export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

/** Types the bot can send besides the 18. */
export const EXTRA_TYPES = ["shadow", "typeless", "unknown"] as const;

export type TypeName = (typeof POKEMON_TYPES)[number] | (typeof EXTRA_TYPES)[number];

const ALL_TYPES: readonly string[] = [...POKEMON_TYPES, ...EXTRA_TYPES];

/** Fill and text colour per type. */
export const TYPE_COLORS: Record<TypeName, { bg: string; fg: string }> = {
  normal: { bg: "#c8c3a8", fg: "#1c1917" },
  fire: { bg: "#c2410c", fg: "#ffffff" },
  water: { bg: "#0369a1", fg: "#ffffff" },
  electric: { bg: "#facc15", fg: "#1c1917" },
  grass: { bg: "#15803d", fg: "#ffffff" },
  ice: { bg: "#67e8f9", fg: "#083344" },
  fighting: { bg: "#b91c1c", fg: "#ffffff" },
  poison: { bg: "#a21caf", fg: "#ffffff" },
  ground: { bg: "#d4a24c", fg: "#292524" },
  flying: { bg: "#a5b4fc", fg: "#1e1b4b" },
  psychic: { bg: "#db2777", fg: "#ffffff" },
  bug: { bg: "#84cc16", fg: "#1a2e05" },
  rock: { bg: "#a16207", fg: "#ffffff" },
  ghost: { bg: "#6d28d9", fg: "#ffffff" },
  dragon: { bg: "#4338ca", fg: "#ffffff" },
  dark: { bg: "#44403c", fg: "#ffffff" },
  steel: { bg: "#94a3b8", fg: "#0f172a" },
  fairy: { bg: "#f9a8d4", fg: "#500724" },
  shadow: { bg: "#3b0764", fg: "#f3e8ff" },
  typeless: { bg: "#d4d4d8", fg: "#18181b" },
  unknown: { bg: "#5eead4", fg: "#042f2e" },
};

/** The bot's type emoji per type, as Fluxer emoji IDs. */
export const TYPE_EMOJIS: Partial<Record<TypeName, string>> = {
  bug: "1566977355530903553",
  dark: "1566977750214905856",
  dragon: "1566977408861470721",
  electric: "1566977765377314817",
  fairy: "1566977794875863040",
  fighting: "1566977423776423937",
  fire: "1566977808809340928",
  flying: "1566977450376695809",
  ghost: "1566977823430676480",
  grass: "1566977461462237185",
  ground: "1566977838572118016",
  ice: "1566977852648202240",
  normal: "1566977857513598977",
  poison: "1566977516546039808",
  psychic: "1566977917559242754",
  rock: "1566977555976695808",
  steel: "1566978044420161537",
  water: "1566977620136960001",
};

const TYPE_LABELS: Record<TypeName, () => string> = {
  normal: m.common.normal,
  fire: m.pokeflux.typeFire,
  water: m.pokeflux.typeWater,
  electric: m.pokeflux.typeElectric,
  grass: m.pokeflux.typeGrass,
  ice: m.pokeflux.typeIce,
  fighting: m.pokeflux.typeFighting,
  poison: m.pokeflux.typePoison,
  ground: m.pokeflux.typeGround,
  flying: m.pokeflux.typeFlying,
  psychic: m.pokeflux.typePsychic,
  bug: m.pokeflux.typeBug,
  rock: m.pokeflux.typeRock,
  ghost: m.pokeflux.typeGhost,
  dragon: m.pokeflux.typeDragon,
  dark: m.pokeflux.typeDark,
  steel: m.pokeflux.typeSteel,
  fairy: m.pokeflux.typeFairy,
  shadow: m.dashboard.shadow,
  typeless: m.pokeflux.typeTypeless,
  unknown: m.pokeflux.typeUnknown,
};

/** The canonical lowercase type for any casing, or null when the bot sent something new. */
export function normalizeType(type: string | null | undefined): TypeName | null {
  const key = type?.trim().toLowerCase();
  return key && ALL_TYPES.includes(key) ? (key as TypeName) : null;
}

export function typeLabel(type: string): string {
  const key = normalizeType(type);
  return key ? TYPE_LABELS[key]() : humanize(type);
}

/** "life-orb" and "staff_gif" to "Life Orb" and "Staff Gif". */
export function humanize(raw: string): string {
  return raw
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/** The bot sends a null skin, an empty string or the text "NULL" for no skin. */
export function skinOf(pokemon: Pick<PokemonCard, "skin">): string | null {
  const skin = pokemon.skin?.trim();
  return skin && skin.toLowerCase() !== "null" ? skin : null;
}

export function isShadow(pokemon: Pick<PokemonCard, "skin">): boolean {
  return skinOf(pokemon)?.toLowerCase() === "shadow";
}

export function displayName(pokemon: Pick<PokemonCard, "name" | "nickname">): string {
  return pokemon.nickname?.trim() || pokemon.name;
}

/** Colour for an IV percent, from red at 0 to green at 100. */
export function ivColor(percent: number): string {
  if (percent >= 90) return "#22c55e";
  if (percent >= 75) return "#84cc16";
  if (percent >= 50) return "#eab308";
  if (percent >= 25) return "#f97316";
  return "#ef4444";
}

/** A date in the viewer's locale, or the text as given when it does not parse. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(getLocale(), { dateStyle: "medium", timeZone: "UTC" });
}

/** Link to a species page by species ID or identifier. */
export function speciesHref(idOrName: string | number): string {
  return `/dashboard/pokedex/${encodeURIComponent(String(idOrName).toLowerCase())}`;
}

/** Link to the user's Pokémon of a species, optionally narrowed by a list filter such as "shiny". */
export function collectionHref(name: string, filter?: string): string {
  const params = new URLSearchParams({ q: name });
  if (filter) params.set("filter", filter);
  return `/dashboard/pokemon?${params}`;
}

/** Grid classes the Pokémon pages share. */
export const POKEMON_GRID = {
  regular: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2",
  compact: "grid grid-cols-1 min-[440px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2",
} as const;

export type PokemonPageLoader = (query: PokemonListQuery, signal?: AbortSignal) => Promise<PokemonList>;

/** Loads a page of the user's Pokémon from the browser. */
export const fetchPokemonPage: PokemonPageLoader = (query, signal) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return proxyRequest<PokemonList>("GET", `pokemon?${params}`, undefined, signal);
};
