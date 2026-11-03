import { getLocale, m } from "$lib/i18n";
import type { AdminListingStatus } from "$lib/api";

/** A date and time in the viewer's locale, or a dash when there is none. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(getLocale(), { dateStyle: "medium", timeStyle: "short" });
}

/** A score from 0 to 1 as a percentage with one decimal. */
export function percent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/** The colour of a risk score, using the bot's 0.4 and 0.6 cut-offs. */
export function riskColor(score: number, accent: string): string {
  if (score >= 0.6) return accent;
  if (score >= 0.4) return "#f59e0b";
  return "#22c55e";
}

/** "AltAccountTrading" to "Alt account trading". */
export function splitWords(value: string): string {
  const words = value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const FRAUD_TYPES: Record<string, () => string> = {
  AltAccountTrading: m.admin.fraudAlt,
  RealMoneyTrading: m.admin.fraudRmt,
  BotAbuse: m.admin.fraudBot,
  NewbieExploitation: m.admin.fraudNewbie,
  MarketManipulation: m.admin.fraudMarket,
  DuplicationAttempt: m.admin.fraudDupe,
  UnusualBehavior: m.admin.fraudUnusual,
  NetworkCoordination: m.admin.fraudNetwork,
};

const STATUSES: Record<string, () => string> = {
  Pending: m.admin.statusPending,
  InProgress: m.admin.statusInProgress,
  Completed: m.admin.statusCompleted,
  Dismissed: m.admin.statusDismissed,
  Escalated: m.admin.statusEscalated,
};

const ACTIONS: Record<string, () => string> = {
  whitelist: m.admin.whitelist,
  tradeban: m.admin.tradeBan,
  detradeban: m.admin.actionDetradeban,
  market_remove: m.admin.actionMarketRemove,
  spawn_storm: m.admin.spawnStorm,
};

export const LISTING_STATUSES: Record<AdminListingStatus, () => string> = {
  active: m.admin.listingActive,
  sold: m.admin.listingSold,
  removed: m.admin.listingRemoved,
};

export const fraudTypeLabel = (value: string) => FRAUD_TYPES[value]?.() ?? splitWords(value);
export const statusLabel = (value: string) => STATUSES[value]?.() ?? splitWords(value);
export const auditActionLabel = (value: string) => ACTIONS[value]?.() ?? splitWords(value);
