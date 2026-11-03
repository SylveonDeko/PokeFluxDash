import type { GenderFilter, PokemonFilter, PokemonListFilters, PokemonListQuery, PokemonSort } from "$lib/api";
import { GENDER_FILTERS, POKEMON_FILTERS, POKEMON_SORTS, pick } from "$lib/components/pokeflux/labels";

export const PAGE_SIZES = [24, 48, 96] as const;
export const DEFAULT_PAGE_SIZE = 24;
/** Cookie holding the card density. */
export const DENSITY_COOKIE = "pf-pokemon-density";

/** The browser's list state as the URL carries it: `page`, `size`, `sort`, `filter`, `gender`, `q` and `item`. */
export interface ListState {
  page: number;
  pageSize: number;
  sort: PokemonSort;
  filter: PokemonFilter;
  gender: GenderFilter;
  search: string;
  /** Held item filter, empty for none. */
  heldItem: string;
}

export function readListState(params: URLSearchParams): ListState {
  const size = Number(params.get("size"));
  return {
    page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
    sort: pick(params.get("sort"), POKEMON_SORTS, "default"),
    filter: pick(params.get("filter"), POKEMON_FILTERS, "all"),
    gender: pick(params.get("gender"), GENDER_FILTERS, "all"),
    search: (params.get("q") ?? "").trim().slice(0, 100),
    heldItem: (params.get("item") ?? "").trim().slice(0, 100),
  };
}

/** Query string of a list state, leaving defaults out. */
export function listParams(state: Partial<ListState>): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page && state.page > 1) params.set("page", String(state.page));
  if (state.pageSize && state.pageSize !== DEFAULT_PAGE_SIZE) params.set("size", String(state.pageSize));
  if (state.sort && state.sort !== "default") params.set("sort", state.sort);
  if (state.filter && state.filter !== "all") params.set("filter", state.filter);
  if (state.gender && state.gender !== "all") params.set("gender", state.gender);
  if (state.search) params.set("q", state.search);
  if (state.heldItem) params.set("item", state.heldItem);
  return params;
}

/** The sort and filters of a list state, as the list and neighbours endpoints take them. */
export function toApiFilters(state: ListState): PokemonListFilters {
  return {
    sort: state.sort,
    filter: state.filter,
    gender: state.gender,
    search: state.search || undefined,
    heldItem: state.heldItem || undefined,
  };
}

export function toApiQuery(state: ListState): PokemonListQuery {
  return { ...toApiFilters(state), page: state.page, pageSize: state.pageSize };
}

/** Link to a Pokémon's page that keeps the list's sort and filters for stepping. */
export function detailHref(id: string, state: ListState): string {
  const query = listParams({ ...state, page: 1 }).toString();
  return `/dashboard/pokemon/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
}

/** Link back to the list page holding the given 0-based position. */
export function listHref(state: ListState, position: number | null): string {
  const page = position === null ? state.page : Math.floor(position / state.pageSize) + 1;
  const params = listParams({ ...state, page });
  const query = params.toString();
  return `/dashboard/pokemon${query ? `?${query}` : ""}`;
}
