import { m } from "$lib/i18n";
import type { MarketFilter, MarketSort } from "$lib/api";
import { FILTER_LABELS } from "$lib/components/pokeflux/labels";

export const PAGE_SIZE = 24;
/** Highest price the bot accepts. */
export const MAX_PRICE = 2_147_483_647;

export const SORTS: { value: MarketSort; label: () => string }[] = [
  { value: "recent", label: m.pokefluxMarket.sortRecent },
  { value: "price_asc", label: m.pokefluxMarket.sortPriceAsc },
  { value: "price_desc", label: m.pokefluxMarket.sortPriceDesc },
  { value: "iv_desc", label: m.pokefluxMarket.sortIvDesc },
  { value: "level_desc", label: m.pokefluxMarket.sortLevelDesc },
  { value: "level_asc", label: m.pokefluxMarket.sortLevelAsc },
  { value: "name", label: m.pokeflux.sortName },
];

export const FILTERS: { value: MarketFilter; label: () => string }[] = [
  { value: "all", label: m.pokefluxMarket.filterAll },
  ...(["shiny", "radiant", "shadow", "legendary"] as const).map((value) => ({ value, label: FILTER_LABELS[value] })),
];
