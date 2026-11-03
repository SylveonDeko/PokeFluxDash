import { m } from "$lib/i18n";
import type { MarketListing } from "$lib/api";

export function sellerName(listing: Pick<MarketListing, "sellerName">): string {
  return listing.sellerName?.trim() || m.pokefluxMarket.hiddenTrainer();
}
