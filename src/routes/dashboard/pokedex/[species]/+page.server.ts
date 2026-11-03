import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => ({
  species: await createApi(event).species.get(event.params.species),
  shiny: event.url.searchParams.get("shiny") === "1",
});
