<!--
@component
A species' learnset with search, filters and sorting.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { buttonStyle } from "$lib/components/dashboard/styles";
  import { EmptyState, MoveCard } from "$lib/components/pokeflux";
  import MoveFilters from "$lib/components/pokeflux/MoveFilters.svelte";
  import { MoveFilter } from "$lib/components/pokeflux/moveFilter.svelte";
  import type { MoveDetails } from "$lib/api";

  interface Props {
    moves: MoveDetails[];
  }

  let { moves }: Props = $props();

  const filter = new MoveFilter(() => moves);
</script>

{#if moves.length === 0}
  <p class="text-sm" style="color: {$colorStore.muted};">{m.pokefluxPokemon.speciesNoMoves()}</p>
{:else}
  <div class="space-y-3">
    <MoveFilters {filter} />

    <p class="text-xs" style="color: {$colorStore.muted};" aria-live="polite">{m.pokefluxPokemon.learnCount({ shown: filter.shown.length, total: moves.length })}</p>

    {#if filter.shown.length === 0}
      <EmptyState title={m.pokefluxPokemon.learnNoMatch()} icon="fa-solid fa-magnifying-glass" compact>
        <button
          type="button"
          class="px-4 py-2 rounded-xl min-h-[38px] text-sm font-medium transition-all hover:scale-[1.02]"
          style={buttonStyle($colorStore)}
          onclick={() => filter.clear()}
        >
          {m.pokefluxPokemon.clearFilters()}
        </button>
      </EmptyState>
    {:else}
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
        {#each filter.shown as move (move.name)}
          <li class="pf-move"><MoveCard {move} compact class="h-full" /></li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .pf-move {
    content-visibility: auto;
    contain-intrinsic-size: auto 92px;
  }
</style>
