import { m } from "$lib/i18n";
import type { StaffInfo, StaffRank } from "$lib/api";

/** Staff ranks in the bot's order, lowest first. */
export const STAFF_RANKS: readonly StaffRank[] = [
  "User",
  "AI",
  "Support",
  "Gym",
  "Helper",
  "Mod",
  "GymAuth",
  "Investigator",
  "Admin",
  "Developer",
];

/** Whether a rank is at least the required one, the same comparison the bot makes. */
export function hasRank(rank: StaffRank | null | undefined, required: StaffRank): boolean {
  if (!rank) return false;
  return STAFF_RANKS.indexOf(rank) >= STAFF_RANKS.indexOf(required);
}

/** The standing of a user who is not staff, used when the bot cannot be asked. */
export const NO_STAFF: StaffInfo = { staffRank: "User", botOwner: false };

export interface AdminSection {
  href: string;
  label: () => string;
  icon: string;
  /** The lowest rank that can open the page. */
  rank: StaffRank;
}

/** The Admin group of the sidebar, in order. */
export const adminSections: AdminSection[] = [
  { href: "/dashboard/admin", label: m.features.overview, icon: "fa-utility-duo fa-regular fa-shield-halved", rank: "Mod" },
  { href: "/dashboard/admin/detections", label: m.admin.navDetections, icon: "fa-utility-duo fa-regular fa-circle-exclamation", rank: "Mod" },
  { href: "/dashboard/admin/relationship", label: m.admin.navRelationship, icon: "fa-utility-duo fa-regular fa-arrow-right-arrow-left", rank: "Mod" },
  { href: "/dashboard/admin/users", label: m.admin.navUsers, icon: "fa-utility-duo fa-regular fa-circle-user", rank: "Mod" },
  { href: "/dashboard/admin/market", label: m.admin.navMarket, icon: "fa-utility-duo fa-regular fa-shop", rank: "Mod" },
  { href: "/dashboard/admin/audit", label: m.admin.navAudit, icon: "fa-utility-duo fa-regular fa-clipboard-check", rank: "Mod" },
];
