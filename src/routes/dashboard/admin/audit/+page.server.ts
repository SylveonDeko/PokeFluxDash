import { createApi } from "$lib/api/client.server";
import { intParam, snowflakeParam } from "$lib/components/admin/query";
import type { PageServerLoad } from "./$types";

const PAGE_SIZE = 25;

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const query = {
    staff: snowflakeParam(params, "staff"),
    target: snowflakeParam(params, "target"),
    page: intParam(params, "page", 1) ?? 1,
  };
  return { query, audit: await createApi(event).admin.audit({ ...query, pageSize: PAGE_SIZE }) };
};
