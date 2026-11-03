import { error } from "@sveltejs/kit";
import { createApi } from "$lib/api/client.server";
import { m } from "$lib/i18n";
import { isSnowflake } from "$lib/components/admin/query";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { userId } = event.params;
  if (!isSnowflake(userId)) error(404, m.common.notFound());
  return { userId, user: await createApi(event).admin.user(userId) };
};
