import { m } from "$lib/i18n";

/** The listing states the market list can show. */
export const MARKET_STATUSES = ["all", "active", "sold", "removed"] as const;

export type MarketStatus = (typeof MARKET_STATUSES)[number];

export const STATUS_LABELS: Record<MarketStatus, () => string> = {
  all: m.admin.listingAll,
  active: m.admin.listingActive,
  sold: m.admin.listingSold,
  removed: m.admin.listingRemoved,
};
