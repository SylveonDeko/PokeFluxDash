import { m } from "$lib/i18n";

const HOUR_LABELS: Record<number, () => string> = {
  24: m.admin.last24Hours,
  72: m.admin.last3Days,
  168: m.admin.last7Days,
  720: m.admin.last30Days,
  2160: m.admin.last90Days,
};

/** The day counts the fraud statistics can cover. */
export const STAT_WINDOWS = ["1", "7", "30", "90"] as const;

/** The hour counts the detection list can cover. */
export const DETECTION_WINDOWS = ["24", "72", "168", "720"] as const;

/** The label of a window given in hours. */
export const hoursLabel = (hours: number) => HOUR_LABELS[hours]?.() ?? m.admin.lastHours({ count: hours });
