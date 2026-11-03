import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  event.depends("pokeflux:party");
  return { party: createApi(event).party.get() };
};
