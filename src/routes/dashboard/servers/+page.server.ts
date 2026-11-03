import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  return { guilds: await createApi(event).guilds.list() };
};
