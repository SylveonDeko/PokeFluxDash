import { m } from "$lib/i18n";
import type { GenderFilter, PokemonFilter, PokemonSort } from "$lib/api";

export const POKEMON_SORTS: PokemonSort[] = ["default", "iv", "level", "name", "recent", "type", "favorite", "party", "champion"];

export const POKEMON_FILTERS: PokemonFilter[] = [
  "all",
  "shiny",
  "radiant",
  "shadow",
  "legendary",
  "favorite",
  "champion",
  "party",
  "market",
  "egg",
];

export const GENDER_FILTERS: GenderFilter[] = ["all", "male", "female", "genderless"];

export const SORT_LABELS: Record<PokemonSort, () => string> = {
  default: m.pokeflux.sortDefault,
  iv: m.common.iv,
  level: m.pokeflux.sortLevel,
  name: m.pokeflux.sortName,
  recent: m.pokeflux.sortRecent,
  type: m.common.type,
  favorite: m.pokeflux.sortFavorite,
  party: m.pokeflux.sortParty,
  champion: m.pokeflux.sortChampion,
};

export const FILTER_LABELS: Record<PokemonFilter, () => string> = {
  all: m.common.allPokemon,
  shiny: m.common.shiny,
  radiant: m.common.radiant,
  shadow: m.dashboard.shadow,
  legendary: m.dashboard.legendary,
  favorite: m.pokeflux.filterFavorite,
  champion: m.pokeflux.filterChampion,
  party: m.pokeflux.badgeInParty,
  market: m.pokeflux.filterMarket,
  egg: m.pokeflux.filterEgg,
};

/** Icon, colour and label of each gender. */
export const GENDERS = {
  male: { icon: "fa-mars", color: "#60a5fa", label: m.pokeflux.genderMale },
  female: { icon: "fa-venus", color: "#f472b6", label: m.pokeflux.genderFemale },
  genderless: { icon: "fa-genderless", color: "#9ca3af", label: m.pokeflux.genderGenderless },
} as const;

/** Icon and colour of each flag a Pokémon can carry. */
export const FLAGS = {
  shiny: { icon: "fa-sparkles", color: "#eab308" },
  radiant: { icon: "fa-sun", color: "#f97316" },
  shadow: { icon: "fa-moon", color: "#8b5cf6" },
  legendary: { icon: "fa-crown", color: "#ca8a04" },
  favorite: { icon: "fa-heart", color: "#f43f5e" },
} as const;

/** `value` when it is one of `allowed`, otherwise `fallback`. */
export function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
