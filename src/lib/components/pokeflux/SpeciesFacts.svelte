<!--
@component
A species' abilities, with the hidden one marked, and its generation, catch rate, weight and base happiness.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import type { SpeciesDetail } from "$lib/api";
  import { humanize } from "./pokemon";

  interface Props {
    species: SpeciesDetail;
    class?: string;
  }

  let { species, class: className = "" }: Props = $props();
</script>

{#snippet fact(icon: string, label: string, value: string)}
  <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg min-w-0" style="background: {$colorStore.primary}10;">
    <i class="fa-solid {icon} shrink-0 w-4 text-center" style="color: {$colorStore.secondary}; font-size: 14px;" aria-hidden="true"></i>
    <div class="min-w-0">
      <dt class="text-xs" style="color: {$colorStore.muted};">{label}</dt>
      <dd class="text-sm font-medium truncate" style="color: {$colorStore.text};" title={value}>{value}</dd>
    </div>
  </div>
{/snippet}

<div class="space-y-4 {className}">
  <div>
    <h3 class="text-xs mb-1.5" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesAbilities()}</h3>
    {#if species.abilities.length}
      <ul class="flex flex-wrap gap-2">
        {#each species.abilities as ability (ability.name)}
          <li
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style="background: {$colorStore.primary}10; border: 1px solid {ability.hidden ? `${$colorStore.secondary}40` : 'transparent'}; color: {$colorStore.text};"
          >
            {humanize(ability.name)}
            {#if ability.hidden}
              <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded" style="background: {$colorStore.secondary}20; color: {$colorStore.secondary};">{m.pokefluxPokemon.speciesHidden()}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm" style="color: {$colorStore.muted};">{m.common.none()}</p>
    {/if}
  </div>

  <dl class="grid grid-cols-2 gap-2">
    {#if species.generation !== null}
      {@render fact("fa-layer-group", m.pokefluxPokemon.speciesGeneration(), String(species.generation))}
    {/if}
    {#if species.catchRate !== null}
      {@render fact("fa-bullseye", m.pokefluxPokemon.speciesCatchRate(), m.pokefluxPokemon.speciesCatchRateValue({ rate: species.catchRate }))}
    {/if}
    {#if species.weightKg !== null}
      {@render fact("fa-weight-hanging", m.pokefluxPokemon.speciesWeight(), m.pokefluxPokemon.speciesWeightValue({ kg: species.weightKg.toLocaleString() }))}
    {/if}
    {#if species.baseHappiness !== null}
      {@render fact("fa-face-smile", m.pokefluxPokemon.speciesBaseHappiness(), species.baseHappiness.toLocaleString())}
    {/if}
  </dl>
</div>
