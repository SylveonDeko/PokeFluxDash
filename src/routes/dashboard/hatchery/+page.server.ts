import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  event.depends("pokeflux:hatchery");
  const api = createApi(event);
  return { hatchery: api.hatchery.get(), breeding: api.breeding.get() };
};
