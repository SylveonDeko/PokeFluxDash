import { createApi } from "$lib/api/client.server";
import type { PokedexVariant } from "$lib/api";
import type { PageServerLoad } from "./$types";

const VARIANTS: PokedexVariant[] = ["national", "shiny", "radiant", "shadow", "skin", "unowned"];

export const load: PageServerLoad = async (event) => {
  const asked = event.url.searchParams.get("variant") as PokedexVariant | null;
  const variant = asked && VARIANTS.includes(asked) ? asked : "national";
  return { variant, variants: VARIANTS, pokedex: await createApi(event).pokedex.get(variant) };
};
