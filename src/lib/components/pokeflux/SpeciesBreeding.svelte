<!--
@component
A species' egg groups, gender ratio and egg cycles.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { SpeciesDetail } from "$lib/api";
  import { humanize } from "./pokemon";
  import { GENDERS } from "./labels";

  interface Props {
    species: SpeciesDetail;
    class?: string;
  }

  let { species, class: className = "" }: Props = $props();
</script>

<dl class="space-y-4 {className}">
  <div>
    <dt class="text-sm mb-2" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesEggGroups()}</dt>
    <dd>
      {#if species.eggGroups.length}
        <ul class="flex flex-wrap gap-2">
          {#each species.eggGroups as group (group)}
            <li class="px-3 py-1 rounded-full text-xs font-semibold" style="background: {$colorStore.primary}15; border: 1px solid {$colorStore.primary}30; color: {$colorStore.primary};">{humanize(group)}</li>
          {/each}
        </ul>
      {:else}
        <span class="text-sm" style="color: {$colorStore.text};">{m.pokefluxPokemon.unknown()}</span>
      {/if}
    </dd>
  </div>
  <div>
    <dt class="text-sm mb-2" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesGenderRatio()}</dt>
    <dd>
      {#if species.femalePercent === null}
        <span class="text-sm inline-flex items-center gap-2" style="color: {$colorStore.text};">
          <i class="fa-solid {GENDERS.genderless.icon}" style="color: {GENDERS.genderless.color};" aria-hidden="true"></i>{GENDERS.genderless.label()}
        </span>
      {:else}
        {@const female = species.femalePercent}
        <p class="text-sm mb-2 flex flex-wrap gap-x-4 gap-y-1" style="color: {$colorStore.text};">
          <span class="inline-flex items-center gap-1.5"><i class="fa-solid {GENDERS.male.icon}" style="color: {GENDERS.male.color};" aria-hidden="true"></i>{m.pokefluxPokemon.speciesMalePercent({ percent: (100 - female).toLocaleString() })}</span>
          <span class="inline-flex items-center gap-1.5"><i class="fa-solid {GENDERS.female.icon}" style="color: {GENDERS.female.color};" aria-hidden="true"></i>{m.pokefluxPokemon.speciesFemalePercent({ percent: female.toLocaleString() })}</span>
        </p>
        <div class="h-2 rounded-full overflow-hidden flex" style="background: {$colorStore.primary}20;" aria-hidden="true">
          <div class="h-full" style="width: {100 - female}%; background: {GENDERS.male.color};"></div>
          <div class="h-full" style="width: {female}%; background: {GENDERS.female.color};"></div>
        </div>
      {/if}
    </dd>
  </div>
  {#if species.hatchCounter !== null}
    <div>
      <dt class="text-sm mb-1" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesEggCycles()}</dt>
      <dd class="text-sm font-medium tabular-nums" style="color: {$colorStore.text};">{species.hatchCounter.toLocaleString()}</dd>
    </div>
  {/if}
</dl>
