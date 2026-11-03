import { createApi } from "$lib/api/client.server";
import { pick } from "$lib/components/pokeflux/labels";
import { intParam } from "$lib/components/admin/query";
import { DETECTION_WINDOWS } from "../windows";
import type { PageServerLoad } from "./$types";

const PAGE_SIZE = 25;

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const hours = Number(pick(params.get("hours"), DETECTION_WINDOWS, "24"));
  const page = intParam(params, "page", 1) ?? 1;
  return { hours, detections: await createApi(event).admin.detections({ hours, page, pageSize: PAGE_SIZE }) };
};
