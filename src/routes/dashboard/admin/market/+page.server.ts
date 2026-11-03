import { createApi } from "$lib/api/client.server";
import { pick } from "$lib/components/pokeflux/labels";
import { intParam, snowflakeParam } from "$lib/components/admin/query";
import { MARKET_STATUSES } from "./statuses";
import type { PageServerLoad } from "./$types";

const PAGE_SIZE = 25;

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const query = {
    status: pick(params.get("status"), MARKET_STATUSES, "all"),
    seller: snowflakeParam(params, "seller"),
    buyer: snowflakeParam(params, "buyer"),
    minPrice: intParam(params, "minPrice"),
    maxPrice: intParam(params, "maxPrice"),
    page: intParam(params, "page", 1) ?? 1,
  };
  return { query, market: await createApi(event).admin.market({ ...query, pageSize: PAGE_SIZE }) };
};
