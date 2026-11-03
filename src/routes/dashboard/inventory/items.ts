import { m } from "$lib/i18n";
import type { ItemCount } from "$lib/api";
import { humanize } from "$lib/components/pokeflux";

/** The key of items the bot's item data has no category for. */
export const OTHER = "other";

export interface ItemGroup {
  /** The bot's category identifier, or {@link OTHER}. */
  key: string;
  label: () => string;
  icon: string;
  color: string;
}

const LOOKS: Record<string, { icon: string; color: string }> = {
  "held-items": { icon: "fa-solid fa-hand-holding", color: "#f97316" },
  "bad-held-items": { icon: "fa-solid fa-skull", color: "#a855f7" },
  choice: { icon: "fa-solid fa-hand-holding", color: "#f97316" },
  "type-enhancement": { icon: "fa-solid fa-bolt", color: "#eab308" },
  "type-protection": { icon: "fa-solid fa-shield-halved", color: "#14b8a6" },
  plates: { icon: "fa-solid fa-square", color: "#64748b" },
  memories: { icon: "fa-solid fa-compact-disc", color: "#64748b" },
  "species-specific": { icon: "fa-solid fa-star", color: "#f59e0b" },
  evolution: { icon: "fa-solid fa-dna", color: "#22c55e" },
  "mega-stones": { icon: "fa-solid fa-gem", color: "#a78bfa" },
  "z-crystals": { icon: "fa-solid fa-gem", color: "#38bdf8" },
  jewels: { icon: "fa-solid fa-gem", color: "#ec4899" },
  "standard-balls": { icon: "fa-solid fa-circle-half-stroke", color: "#ef4444" },
  "special-balls": { icon: "fa-solid fa-circle-half-stroke", color: "#ef4444" },
  "apricorn-balls": { icon: "fa-solid fa-circle-half-stroke", color: "#ef4444" },
  medicine: { icon: "fa-solid fa-apple-whole", color: "#ef4444" },
  "in-a-pinch": { icon: "fa-solid fa-apple-whole", color: "#ef4444" },
  "picky-healing": { icon: "fa-solid fa-apple-whole", color: "#ef4444" },
  "effort-drop": { icon: "fa-solid fa-apple-whole", color: "#ef4444" },
  "baking-only": { icon: "fa-solid fa-apple-whole", color: "#ef4444" },
  vitamins: { icon: "fa-solid fa-flask", color: "#0ea5e9" },
  healing: { icon: "fa-solid fa-kit-medical", color: "#22c55e" },
  "status-cures": { icon: "fa-solid fa-kit-medical", color: "#22c55e" },
  revival: { icon: "fa-solid fa-heart-pulse", color: "#22c55e" },
  "pp-recovery": { icon: "fa-solid fa-kit-medical", color: "#22c55e" },
  "effort-training": { icon: "fa-solid fa-dumbbell", color: "#f97316" },
  training: { icon: "fa-solid fa-dumbbell", color: "#f97316" },
  "stat-boosts": { icon: "fa-solid fa-arrow-trend-up", color: "#ec4899" },
  "all-machines": { icon: "fa-solid fa-compact-disc", color: "#6366f1" },
  gameplay: { icon: "fa-solid fa-gamepad", color: "#0ea5e9" },
};

const DEFAULT_LOOK = { icon: "fa-solid fa-cube", color: "#9ca3af" };

export function groupOf(item: ItemCount): string {
  return item.category ?? OTHER;
}

export function itemGroup(key: string): ItemGroup {
  const look = LOOKS[key] ?? DEFAULT_LOOK;
  return {
    key,
    label: key === OTHER ? m.pokefluxCollection.groupOther : () => humanize(key),
    icon: look.icon,
    color: look.color,
  };
}

/** The groups of some items, by name with {@link OTHER} last. */
export function groupsOf(items: ItemCount[]): ItemGroup[] {
  const keys = [...new Set(items.map(groupOf))];
  return keys
    .sort((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b)))
    .map(itemGroup);
}

/** Items bucketed by the bot's category, leaving out empty groups. */
export function groupItems(items: ItemCount[]): { group: ItemGroup; items: ItemCount[] }[] {
  return groupsOf(items).map((group) => ({ group, items: items.filter((item) => groupOf(item) === group.key) }));
}
