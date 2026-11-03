import { createApi } from "$lib/api/client.server";
import { snowflakeParam } from "$lib/components/admin/query";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const params = event.url.searchParams;
  const user1 = snowflakeParam(params, "user1") ?? "";
  const user2 = snowflakeParam(params, "user2") ?? "";
  const relationship = user1 && user2 ? await createApi(event).admin.relationship(user1, user2) : null;
  return { user1, user2, relationship };
};
