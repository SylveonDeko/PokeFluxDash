import { createApi } from "$lib/api/client.server";
import type { PokemonNeighbours, SpeciesDetail } from "$lib/api";
import { readListState, toApiFilters } from "../query";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const api = createApi(event);
  const state = readListState(event.url.searchParams);
  const id = event.params.id;

  const detail = await api.pokemon.get(id);
  const neighbours: Promise<PokemonNeighbours | null> = detail.ok
    ? api.pokemon.neighbours(id, toApiFilters(state)).then((response) => (response.ok ? response.data : null))
    : Promise.resolve(null);
  const species: Promise<SpeciesDetail | null> = detail.ok
    ? api.species.get(detail.data.name).then((response) => (response.ok ? response.data : null))
    : Promise.resolve(null);

  return { detail, state, neighbours, species };
};
