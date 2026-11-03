import { createApi } from "$lib/api/client.server";
import type { PageServerLoad } from "./$types";
import { DENSITY_COOKIE, readListState, toApiQuery } from "./query";

export const load: PageServerLoad = async (event) => {
  const state = readListState(event.url.searchParams);
  const density: "regular" | "compact" = event.cookies.get(DENSITY_COOKIE) === "compact" ? "compact" : "regular";
  return { state, density, list: await createApi(event).pokemon.list(toApiQuery(state)) };
};
