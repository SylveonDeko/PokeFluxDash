import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const search = event.url.searchParams.get("search")?.trim().slice(0, 50) ?? "";
  return { search, results: search ? await createApi(event).admin.searchUsers(search) : null };
};
