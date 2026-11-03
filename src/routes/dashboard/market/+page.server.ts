import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";
import { pick } from "$lib/components/pokeflux/labels";
import { FILTERS, PAGE_SIZE, SORTS } from "./market";

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const tab: "browse" | "mine" = params.get("tab") === "mine" ? "mine" : "browse";
  const query = {
    sort: pick(params.get("sort"), SORTS.map((option) => option.value), "recent"),
    filter: pick(params.get("filter"), FILTERS.map((option) => option.value), "all"),
    search: params.get("search")?.trim().slice(0, 50) ?? "",
    page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
  };

  const api = createApi(event);
  const [market, mine, profile] = await Promise.all([
    tab === "browse"
      ? api.market.list({ ...query, search: query.search || undefined, pageSize: PAGE_SIZE })
      : Promise.resolve(null),
    api.market.mine(),
    api.me.get(),
  ]);

  return { tab, query, market, mine, credits: profile.ok ? profile.data.credits : null };
};
