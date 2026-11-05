<!--
@component
The search box and type, category and sort menus for a {@link MoveFilter}.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import DiscordSelector from "$lib/components/forms/DiscordSelector.svelte";
  import SearchInput from "$lib/components/dashboard/SearchInput.svelte";
  import type { MoveCategory } from "$lib/api";
  import type { MoveFilter, MoveSort } from "./moveFilter.svelte";
  import { typeLabel } from "./pokemon";

  interface Props {
    filter: MoveFilter;
    autofocus?: boolean;
  }

  let { filter, autofocus = false }: Props = $props();
</script>

<div class="flex flex-col md:flex-row gap-2">
  <SearchInput class="flex-1" data-autofocus={autofocus || undefined} bind:value={filter.search} placeholder={m.pokefluxPokemon.learnSearch()} />
  <div class="grid grid-cols-3 gap-2 md:flex">
    <div class="min-w-0 md:w-40">
      <DiscordSelector
        type="custom"
        customIcon="fa-tag"
        options={[{ id: "all", name: m.pokefluxPokemon.allTypes() }, ...filter.types.map((t) => ({ id: t, name: typeLabel(t) }))]}
        selected={filter.type}
        ariaLabel={m.common.type()}
        onchange={({ selected }) => selected && (filter.type = selected as string)}
      />
    </div>
    <div class="min-w-0 md:w-40">
      <DiscordSelector
        type="custom"
        customIcon="fa-layer-group"
        options={[
          { id: "all", name: m.pokefluxPokemon.allCategories() },
          { id: "physical", name: m.pokeflux.categoryPhysical() },
          { id: "special", name: m.pokeflux.categorySpecial() },
          { id: "status", name: m.pokeflux.categoryStatus() },
        ]}
        selected={filter.category}
        searchable={false}
        ariaLabel={m.pokefluxPokemon.learnCategory()}
        onchange={({ selected }) => selected && (filter.category = selected as "all" | MoveCategory)}
      />
    </div>
    <div class="min-w-0 md:w-40">
      <DiscordSelector
        type="custom"
        customIcon="fa-arrow-down-wide-short"
        options={[
          { id: "name", name: m.pokeflux.sortName() },
          { id: "power", name: m.pokeflux.power() },
          { id: "accuracy", name: m.pokeflux.accuracy() },
          { id: "pp", name: m.pokeflux.pp() },
        ]}
        selected={filter.sort}
        searchable={false}
        ariaLabel={m.pokeflux.sortLabel()}
        onchange={({ selected }) => selected && (filter.sort = selected as MoveSort)}
      />
    </div>
  </div>
</div>
