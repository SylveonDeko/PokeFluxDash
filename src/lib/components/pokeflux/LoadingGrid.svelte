<!--
@component
Skeleton cards shaped like PokemonCard, for lists that are loading.
-->
<script lang="ts">
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { POKEMON_GRID } from "./pokemon";

  interface Props {
    count?: number;
    size?: "regular" | "compact";
    /** Grid classes, the card grid by default. */
    gridClass?: string;
  }

  let { count = 12, size = "regular", gridClass }: Props = $props();

  let compact = $derived(size === "compact");
  let bone = $derived(`background: ${$colorStore.primary}20; opacity: 0.3;`);
</script>

<div class={gridClass ?? POKEMON_GRID[size]} role="status" aria-busy="true" aria-live="polite">
  <span class="sr-only">{m.pokeflux.loading()}</span>
  {#each { length: count }, i (i)}
    <div
      class="rounded-xl border animate-pulse motion-reduce:animate-none {compact ? 'p-2 flex items-center gap-2' : 'p-2.5 flex flex-col items-center gap-2'}"
      style="background: {$colorStore.primary}05; border-color: {$colorStore.primary}15; animation-delay: {(i % 6) * 80}ms;"
      aria-hidden="true"
    >
      {#if compact}
        <div class="w-12 h-12 rounded-full shrink-0" style={bone}></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 w-3/4 rounded" style={bone}></div>
          <div class="h-2 w-1/2 rounded" style={bone}></div>
          <div class="h-1.5 w-full rounded-full" style={bone}></div>
        </div>
      {:else}
        <div class="h-3 w-full rounded" style={bone}></div>
        <div class="w-16 h-16 rounded-full my-1" style={bone}></div>
        <div class="h-3 w-3/4 rounded" style={bone}></div>
        <div class="h-2 w-1/2 rounded" style={bone}></div>
        <div class="h-1.5 w-full rounded-full" style={bone}></div>
        <div class="h-4 w-1/2 rounded-full" style={bone}></div>
      {/if}
    </div>
  {/each}
</div>
