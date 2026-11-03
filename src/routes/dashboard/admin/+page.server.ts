import { createApi } from "$lib/api/client.server";
import { pick } from "$lib/components/pokeflux/labels";
import { STAT_WINDOWS } from "./windows";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const days = Number(pick(event.url.searchParams.get("days"), STAT_WINDOWS, "7"));
  const api = createApi(event);
  const [stats, detections, audit] = await Promise.all([
    api.admin.stats(days),
    api.admin.detections({ hours: 24, pageSize: 5 }),
    api.admin.audit({ pageSize: 5 }),
  ]);
  return { days, stats, detections, audit };
};
