import { createApi } from "$lib/api/client.server";
import type { BotResponse, PokemonDetail } from "$lib/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const api = createApi(event);
  const profile = api.me.get();
  const selected = profile.then((response): Promise<BotResponse<PokemonDetail>> | null =>
    response.ok && response.data.selectedPokemonId ? api.pokemon.get(response.data.selectedPokemonId) : null,
  );
  return { profile, selected };
};
