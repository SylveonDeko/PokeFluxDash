import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const api = createApi(event);
  const [missions, achievements] = await Promise.all([api.me.missions(), api.me.achievements()]);
  return { missions, achievements };
};
